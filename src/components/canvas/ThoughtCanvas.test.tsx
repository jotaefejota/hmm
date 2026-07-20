import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockDataset, TEAM_LEAD_DILEMMA } from "../../content/mock-dataset";
import { createInitialSessionState } from "../../session/session-types";
import { ThoughtCanvas } from "./ThoughtCanvas";

describe("ThoughtCanvas", () => {
  it("renders the first molecule and synchronized initial progress", () => {
    const round = mockDataset.scenarios[0].rounds[0];
    const state = {
      ...createInitialSessionState(1),
      phase: "round-ready" as const,
      dilemma: TEAM_LEAD_DILEMMA,
      currentRound: round,
      dataSource: "mock" as const,
    };
    render(
      <ThoughtCanvas
        state={state}
        onSelectAnswer={vi.fn()}
        onSelectCustomAnswer={vi.fn()}
        onOpenCustomAnswer={vi.fn()}
        onCloseCustomAnswer={vi.fn()}
        onCommitSelection={vi.fn()}
        onTransitionComplete={vi.fn()}
        onContinueAfterClarity={vi.fn()}
        onFinish={vi.fn()}
        onRetry={vi.fn()}
        onUsePrepared={vi.fn()}
        onRestart={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: round.question })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Possibility/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "None quite fit" })).toBeInTheDocument();
    expect(screen.getByText("You brought")).toBeInTheDocument();
    expect(screen.getByText("Starting out")).toBeInTheDocument();
    expect(screen.getByText("0 of up to 5")).toBeInTheDocument();
  });

  it("keeps every committed question and answer as a text-bearing history node", () => {
    const scenario = mockDataset.scenarios[0];
    const history = scenario.rounds.slice(0, 2).map((round, index) => ({
      round: index + 1,
      question: round.question,
      answer: round.answers[0],
      answerSource: "suggested" as const,
      choiceIndex: 0 as const,
    }));
    const state = {
      ...createInitialSessionState(3),
      phase: "round-ready" as const,
      dilemma: TEAM_LEAD_DILEMMA,
      history,
      currentRound: scenario.rounds[2],
      dataSource: "mock" as const,
    };
    const { container } = render(
      <ThoughtCanvas
        state={state}
        onSelectAnswer={vi.fn()}
        onSelectCustomAnswer={vi.fn()}
        onOpenCustomAnswer={vi.fn()}
        onCloseCustomAnswer={vi.fn()}
        onCommitSelection={vi.fn()}
        onTransitionComplete={vi.fn()}
        onContinueAfterClarity={vi.fn()}
        onFinish={vi.fn()}
        onRetry={vi.fn()}
        onUsePrepared={vi.fn()}
        onRestart={vi.fn()}
      />,
    );

    const historyNodes = container.querySelectorAll("[data-history-node]");
    expect(historyNodes).toHaveLength(5);
    expect(container.querySelector('[data-history-node="question-1"]')).toHaveTextContent(scenario.rounds[0].question);
    expect(container.querySelector('[data-history-node="answer-2"]')).toHaveTextContent(scenario.rounds[1].answers[0]);
  });

  it("keeps the same outer cell elements when a later round takes focus", () => {
    const scenario = mockDataset.scenarios[0];
    const callbacks = {
      onSelectAnswer: vi.fn(),
      onSelectCustomAnswer: vi.fn(),
      onOpenCustomAnswer: vi.fn(),
      onCloseCustomAnswer: vi.fn(),
      onCommitSelection: vi.fn(),
      onTransitionComplete: vi.fn(),
      onContinueAfterClarity: vi.fn(),
      onFinish: vi.fn(),
      onRetry: vi.fn(),
      onUsePrepared: vi.fn(),
      onRestart: vi.fn(),
    };
    const firstState = {
      ...createInitialSessionState(1),
      phase: "round-ready" as const,
      dilemma: TEAM_LEAD_DILEMMA,
      currentRound: scenario.rounds[0],
      dataSource: "mock" as const,
    };
    const { container, rerender } = render(<ThoughtCanvas state={firstState} {...callbacks} />);
    const originalCells = Array.from(container.querySelectorAll("[data-cell-slot]"));

    const secondState = {
      ...firstState,
      history: [{
        round: 1,
        question: scenario.rounds[0].question,
        answer: scenario.rounds[0].answers[1],
        answerSource: "suggested" as const,
        choiceIndex: 1 as const,
      }],
      currentRound: scenario.rounds[1],
      activeRequestId: 2,
    };
    rerender(<ThoughtCanvas state={secondState} {...callbacks} />);
    const laterCells = Array.from(container.querySelectorAll("[data-cell-slot]"));

    expect(laterCells).toHaveLength(originalCells.length);
    expect(laterCells.every((cell, index) => cell === originalCells[index])).toBe(true);
  });
});
