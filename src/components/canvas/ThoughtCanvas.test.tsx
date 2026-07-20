import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockDataset, TEAM_LEAD_DILEMMA } from "../../content/mock-dataset";
import type { SessionState } from "../../session/session-types";
import { ThoughtCanvas } from "./ThoughtCanvas";

describe("ThoughtCanvas", () => {
  it("renders the first molecule and synchronized initial progress", () => {
    const round = mockDataset.scenarios[0].rounds[0];
    const state: SessionState = {
      phase: "round-ready",
      dilemma: TEAM_LEAD_DILEMMA,
      history: [],
      currentRound: round,
      dataSource: "mock",
    };
    render(<ThoughtCanvas state={state} round={round} />);

    expect(screen.getByRole("heading", { name: round.question })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByText("You brought")).toBeInTheDocument();
    expect(screen.getByText("Starting out")).toBeInTheDocument();
    expect(screen.getByText("0 of up to 5")).toBeInTheDocument();
    expect(screen.queryByText(/certainty|confidence|clarity/i)).not.toBeInTheDocument();
  });
});

