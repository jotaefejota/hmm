import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockDataset, TEAM_LEAD_DILEMMA } from "../../content/mock-dataset";
import { createInitialSessionState, type ReflectionStep } from "../../session/session-types";
import { ThoughtCanvas } from "./ThoughtCanvas";

const scenario = mockDataset.scenarios[0];
const callbacks = () => ({
  onSelectAnswer: vi.fn(), onOpenLens: vi.fn(), onReturnToLenses: vi.fn(), onSelectCustomAnswer: vi.fn(),
  onOpenCustomAnswer: vi.fn(), onCloseCustomAnswer: vi.fn(), onCommitSelection: vi.fn(),
  onTransitionComplete: vi.fn(), onFinish: vi.fn(), onContinueFromFinish: vi.fn(),
  onRetry: vi.fn(), onUsePrepared: vi.fn(), onRestart: vi.fn(),
});
const historyStep = (round = 1): ReflectionStep => {
  const lens = scenario.discoveries[round - 1].lenses[0];
  return { round, lensTheme: lens.theme, lensIndex: 0, question: lens.question, answer: lens.answers[0], answerSource: "suggested", choiceIndex: 0 };
};

describe("ThoughtCanvas discovery", () => {
  it("shows exactly two question lenses before answers", async () => {
    const props = callbacks();
    const state = { ...createInitialSessionState(1), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, currentDiscovery: scenario.discoveries[0], dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);
    const lenses = screen.getAllByRole("button", { name: /Explore/ });
    expect(lenses).toHaveLength(2);
    expect(screen.queryAllByRole("button", { name: /^Possibility/ })).toHaveLength(0);
    await userEvent.click(lenses[1]);
    expect(props.onOpenLens).toHaveBeenCalledWith(1);
  });

  it("opens the contextual fortune without changing the reflection", async () => {
    const state = { ...createInitialSessionState(1), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, currentDiscovery: scenario.discoveries[0], dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...callbacks()} />);
    const fortune = screen.getByRole("button", { name: "Open a refreshing angle" });
    await userEvent.click(fortune);
    expect(screen.getByRole("button", { name: scenario.discoveries[0].fortune })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /Explore/ })).toHaveLength(2);
  });

  it("shows one opened question, three answers, and a local return action", async () => {
    const props = callbacks();
    const lens = scenario.discoveries[0].lenses[1];
    const state = { ...createInitialSessionState(1), phase: "round-ready" as const, dilemma: TEAM_LEAD_DILEMMA, currentDiscovery: scenario.discoveries[0], selectedLensIndex: 1 as const, dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);
    expect(screen.getByRole("heading", { name: lens.question })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Possibility/ })).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: "Try the other angle" }));
    expect(props.onReturnToLenses).toHaveBeenCalledOnce();
  });

  it("unfolds a settled decision, then opens read-only detail from its answer", async () => {
    const props = callbacks();
    const step = historyStep();
    const state = { ...createInitialSessionState(2), phase: "lens-ready" as const, dilemma: TEAM_LEAD_DILEMMA, history: [step], currentDiscovery: scenario.discoveries[1], dataSource: "mock" as const };
    render(<ThoughtCanvas state={state} {...props} />);
    await userEvent.click(screen.getByRole("button", { name: `Unfold decision from round 1: ${step.answer}` }));
    await userEvent.click(screen.getByRole("button", { name: `Review round 1: ${step.answer}` }));
    expect(screen.getByRole("complementary", { name: "Review round 1" })).toHaveTextContent(step.question);
    expect(screen.getByRole("complementary", { name: "Review round 1" })).toHaveTextContent(step.answer);
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
    render(<ThoughtCanvas state={state} {...props} />);
    const finish = screen.getByRole("button", { name: "Open reflection lens" });
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
