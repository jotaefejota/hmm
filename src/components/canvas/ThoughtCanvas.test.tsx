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
      />,
    );

    expect(screen.getByRole("heading", { name: round.question })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Possibility/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "None quite fit" })).toBeInTheDocument();
    expect(screen.getByText("You brought")).toBeInTheDocument();
    expect(screen.getByText("Starting out")).toBeInTheDocument();
    expect(screen.getByText("0 of up to 5")).toBeInTheDocument();
  });
});

