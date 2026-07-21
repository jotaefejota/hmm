import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CAMERA_DILEMMA as TEAM_LEAD_DILEMMA, mockDataset } from "../../content/mock-dataset";
import { getHistoryAnswerCellId } from "../../layout/cell-field";
import { createInitialSessionState, type ReflectionStep } from "../../session/session-types";
import { ThoughtCanvas } from "./ThoughtCanvas";

const scenario = mockDataset.scenarios[0];
const callbacks = () => ({
  onSelectAnswer: vi.fn(), onOpenLens: vi.fn(), onOpenFortune: vi.fn(), onReturnToLenses: vi.fn(), onSelectCustomAnswer: vi.fn(),
  onReviseHistorySelection: vi.fn(),
  onOpenCustomAnswer: vi.fn(), onCloseCustomAnswer: vi.fn(), onCommitSelection: vi.fn(),
  onTransitionComplete: vi.fn(), onFinish: vi.fn(), onContinueFromFinish: vi.fn(),
  onRetry: vi.fn(), onRestart: vi.fn(), onReturnToLanding: vi.fn(),
});
const historyStep = (round = 1): ReflectionStep => {
  const lens = scenario.discoveries[round - 1].lenses[0];
  return { round, lensTheme: lens.theme, lensIndex: 0, question: lens.question, answer: lens.answers[0], answerSource: "suggested", choiceIndex: 0, options: lens.answers };
};

describe("ThoughtCanvas discovery", () => {
  it("shows exactly two question lenses before answers", async () => {
    const props = callbacks();
    const state = { ...createInitialSessionState(1), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, currentDiscovery: scenario.discoveries[0], dataSource: "mock" as const };
    const { container } = render(<ThoughtCanvas state={state} {...props} />);
    const lenses = screen.getAllByRole("button", { name: /Explore/ });
    expect(lenses).toHaveLength(2);
    expect(container.querySelectorAll(".content-lens .question-pin")).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /^Possibility/ })).toHaveLength(0);
    await userEvent.click(lenses[1]);
    expect(props.onOpenLens).toHaveBeenCalledWith(1);
  });

  it("opens the contextual fortune without changing the reflection", async () => {
    const state = {
      ...createInitialSessionState(1), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA,
      history: [historyStep()], currentDiscovery: scenario.discoveries[1], dataSource: "mock" as const, fortuneSeed: 0,
    };
    const props = callbacks();
    render(<ThoughtCanvas state={state} {...props} />);
    const fortune = screen.getByRole("button", { name: "Open a refreshing angle" });
    await userEvent.click(fortune);
    expect(screen.getByRole("button", { name: scenario.discoveries[1].fortune })).toBeVisible();
    expect(props.onOpenFortune).toHaveBeenCalledWith(2, scenario.discoveries[1].fortune);
    expect(screen.getAllByRole("button", { name: /Explore/ })).toHaveLength(2);
  });

  it("shows one opened question, three answers, and a local return action", async () => {
    const props = callbacks();
    const lens = scenario.discoveries[0].lenses[1];
    const state = { ...createInitialSessionState(1), phase: "round-ready" as const, dilemma: TEAM_LEAD_DILEMMA, currentDiscovery: scenario.discoveries[0], selectedLensIndex: 1 as const, dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);
    expect(screen.getByRole("heading", { name: lens.question })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Possibility/ })).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "Possibility: Enter your own answer" }));
    expect(props.onOpenCustomAnswer).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Try the other angle" }));
    expect(props.onReturnToLenses).toHaveBeenCalledOnce();
  });

  it("returns to both lenses when the opened question is tapped again", async () => {
    const props = callbacks();
    const lens = scenario.discoveries[0].lenses[1];
    const state = { ...createInitialSessionState(1), phase: "round-ready" as const, dilemma: TEAM_LEAD_DILEMMA, currentDiscovery: scenario.discoveries[0], selectedLensIndex: 1 as const, dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);

    await userEvent.click(screen.getByRole("button", { name: `Close ${lens.theme} and show both question paths` }));

    expect(props.onReturnToLenses).toHaveBeenCalledOnce();
  });

  it("unfolds a settled decision and settles it again from either member", async () => {
    const props = callbacks();
    const step = historyStep();
    const state = { ...createInitialSessionState(2), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, history: [step], currentDiscovery: scenario.discoveries[1], dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);
    expect(screen.getAllByRole("button", { name: /Explore/ })).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` }));

    await userEvent.click(screen.getByRole("button", { name: `Settle decision from round 1: ${step.answer}` }));
    expect(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` })).toBeVisible();
  });

  it("returns to the live lens choices when an unfolded question is activated", async () => {
    const step = historyStep();
    const props = callbacks();
    const state = { ...createInitialSessionState(2), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, history: [step], currentDiscovery: scenario.discoveries[1], dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);

    await userEvent.click(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` }));
    await userEvent.click(screen.getByRole("button", { name: `Settle decision from round 1: ${step.question}` }));

    expect(props.onReturnToLenses).toHaveBeenCalledOnce();
    expect(props.onOpenLens).not.toHaveBeenCalled();
  });

  it("collapses the live question and answers while a historical decision is unfolded", async () => {
    const props = callbacks();
    const step = historyStep();
    const currentLens = scenario.discoveries[1].lenses[1];
    const state = {
      ...createInitialSessionState(2), phase: "round-ready" as const, dilemma: TEAM_LEAD_DILEMMA,
      history: [step], currentDiscovery: scenario.discoveries[1], selectedLensIndex: 1 as const, dataSource: "mock" as const,
    };
    render(<ThoughtCanvas state={state} {...props} />);

    expect(screen.getByRole("heading", { name: currentLens.question })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /^Possibility/ })).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` }));

    expect(screen.queryByRole("heading", { name: currentLens.question })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try the other angle" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Possibility: Enter your own answer" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: `Settle decision from round 1: ${step.answer}` }));

    expect(screen.getByRole("heading", { name: currentLens.question })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /^Possibility/ })).toHaveLength(4);
  });

  it("offers discarded answers as white revision choices when a decision unfolds", async () => {
    const props = callbacks();
    const step = historyStep();
    const state = { ...createInitialSessionState(2), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, history: [step], currentDiscovery: scenario.discoveries[1], dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);

    await userEvent.click(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` }));
    await userEvent.click(screen.getByRole("button", { name: `Possibility: ${step.options![1]}` }));

    expect(props.onReviseHistorySelection).toHaveBeenCalledWith(0, 1);
  });

  it("focuses a settled decision from the progress card without unfolding it", async () => {
    const step = historyStep();
    const state = { ...createInitialSessionState(2), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, history: [step], currentDiscovery: scenario.discoveries[1], dataSource: "mock" as const };
    const { container } = render(<ThoughtCanvas state={state} {...callbacks()} />);
    const field = container.querySelector(".cell-field") as HTMLElement;
    const initialShift = field.style.getPropertyValue("--field-shift-x");

    await userEvent.click(screen.getByRole("button", { name: step.answer }));

    expect(field.style.getPropertyValue("--field-shift-x")).not.toBe(initialShift);
    expect(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` })).toBeVisible();
    expect(screen.queryByRole("button", { name: `Review round 1: ${step.question}` })).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Review round 1" })).toHaveTextContent(step.answer);
  });

  it("keeps the answer slot focused when a progress-focused decision unfolds", async () => {
    const step = historyStep();
    const state = { ...createInitialSessionState(2), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, history: [step], currentDiscovery: scenario.discoveries[1], dataSource: "mock" as const };
    const { container } = render(<ThoughtCanvas state={state} {...callbacks()} />);

    await userEvent.click(screen.getByRole("button", { name: step.answer }));
    await userEvent.click(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` }));

    const answerCellId = getHistoryAnswerCellId([step], 0);
    expect(container.querySelector(`[data-cell-slot="${answerCellId}"].is-review-focus`)).toBeTruthy();
    expect(screen.getByRole("button", { name: `Settle decision from round 1: ${step.answer}` })).toBeVisible();
    expect(screen.queryByRole("complementary", { name: "Review round 1" })).not.toBeInTheDocument();
  });

  it("lets a progress-card link refocus another step while one decision is split", async () => {
    const first = historyStep(1);
    const second = historyStep(2);
    const state = {
      ...createInitialSessionState(3), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA,
      history: [first, second], currentDiscovery: scenario.discoveries[2], dataSource: "mock" as const,
    };
    const { container } = render(<ThoughtCanvas state={state} {...callbacks()} />);

    await userEvent.click(screen.getByRole("button", { name: `Unfold decision from round 1: ${first.answer}` }));
    await userEvent.click(screen.getByRole("button", { name: second.answer }));

    const secondAnswerCell = getHistoryAnswerCellId([first, second], 1);
    expect(container.querySelector(`[data-cell-slot="${secondAnswerCell}"].is-review-focus`)).toBeTruthy();
    expect(screen.getByRole("button", { name: `Settle decision from round 1: ${first.answer}` })).toBeVisible();
  });

  it("keeps stable outer cells across discovery changes", () => {
    const props = callbacks();
    const first = { ...createInitialSessionState(1), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, currentDiscovery: scenario.discoveries[0], dataSource: "mock" as const };
    const { container, rerender } = render(<ThoughtCanvas state={first} {...props} />);
    const cells = Array.from(container.querySelectorAll("[data-cell-slot]"));
    rerender(<ThoughtCanvas state={{ ...first, history: [historyStep()], currentDiscovery: scenario.discoveries[1], activeRequestId: 2 }} {...props} />);
    const later = Array.from(container.querySelectorAll("[data-cell-slot]"));
    expect(later.every((cell, index) => cell === cells[index])).toBe(true);
  });

  it("offers a reflection lens after four answers instead of opening a recap", async () => {
    const props = callbacks();
    const history = Array.from({ length: 4 }, (_, index) => historyStep(index + 1));
    const state = { ...createInitialSessionState(5), phase: "finish-offered" as const, dilemma: TEAM_LEAD_DILEMMA, history, currentDiscovery: scenario.discoveries[4], dataSource: "mock" as const };
    const { container } = render(<ThoughtCanvas state={state} {...props} />);
    const finish = screen.getByRole("button", { name: "Discover what is taking shape" });
    expect(container.querySelector(".field-cell.is-finish")).toBeTruthy();
    expect(container.querySelector(".finish-membrane")).toBeNull();
    await userEvent.click(finish);
    expect(props.onFinish).toHaveBeenCalledWith("suggested");
    expect(screen.queryByText("A direction is taking shape.")).not.toBeInTheDocument();
  });

  it("offers a smaller continuation bubble when another discovery is prepared", async () => {
    const props = callbacks();
    const history = Array.from({ length: 4 }, (_, index) => historyStep(index + 1));
    const state = { ...createInitialSessionState(5), phase: "finish-offered" as const, dilemma: TEAM_LEAD_DILEMMA, history, currentDiscovery: scenario.discoveries[4], dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Keep exploring with new questions" }));
    expect(props.onContinueFromFinish).toHaveBeenCalledOnce();
  });
});
