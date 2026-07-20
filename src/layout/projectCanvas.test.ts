import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import type { ReflectionStep } from "../session/session-types";
import { CELL_SLOTS } from "./cell-field";
import { projectCanvas } from "./projectCanvas";

describe("projectCanvas", () => {
  it("keeps one stable authored cell set while round occupancy changes", () => {
    const scenario = mockDataset.scenarios[0];
    const first = projectCanvas({
      dilemma: scenario.dilemma,
      history: [],
      currentRound: scenario.rounds[0],
      phase: "round-ready",
      selectedAnswer: null,
    });
    const second = projectCanvas({
      dilemma: scenario.dilemma,
      history: [{
        round: 1,
        question: scenario.rounds[0].question,
        answer: scenario.rounds[0].answers[0],
        answerSource: "suggested",
        choiceIndex: 0,
      }],
      currentRound: scenario.rounds[1],
      phase: "round-ready",
      selectedAnswer: null,
    });

    expect(first.cells).toEqual(CELL_SLOTS);
    expect(second.cells).toEqual(CELL_SLOTS);
    expect(first.cells.map((cell) => cell.id)).toEqual(second.cells.map((cell) => cell.id));
    expect(first.cells.map(({ id, x, y }) => ({ id, x, y }))).toEqual(second.cells.map(({ id, x, y }) => ({ id, x, y })));
    expect(first.occupancy.filter((item) => item.kind === "suggestion")).toHaveLength(3);
    expect(second.occupancy.filter((item) => item.kind === "suggestion")).toHaveLength(3);
  });

  it("marks each chosen possibility cell and produces one continuous semantic route", () => {
    const scenario = mockDataset.scenarios[0];
    const history: ReflectionStep[] = scenario.rounds.slice(0, 4).map((round, index) => ({
      round: index + 1,
      question: round.question,
      answer: round.answers[index % 3],
      answerSource: "suggested",
      choiceIndex: index % 3 as 0 | 1 | 2,
    }));
    const projection = projectCanvas({
      dilemma: scenario.dilemma,
      history,
      currentRound: scenario.rounds[4],
      phase: "round-ready",
      selectedAnswer: null,
    });

    expect(projection.occupancy.filter((item) => item.kind === "answer")).toHaveLength(4);
    expect(projection.occupancy.filter((item) => item.kind === "question")).toHaveLength(5);
    expect(projection.edges.filter((item) => item.status !== "active")).toHaveLength(9);
    expect(new Set(projection.occupancy.map((item) => item.cellId)).size).toBe(projection.occupancy.length);
  });

  it("clears rejected content without changing cell geometry during selection", () => {
    const round = mockDataset.scenarios[0].rounds[0];
    const before = projectCanvas({ dilemma: "A dilemma", history: [], currentRound: round, phase: "round-ready", selectedAnswer: null });
    const selected = projectCanvas({
      dilemma: "A dilemma",
      history: [],
      currentRound: round,
      phase: "answer-selected",
      selectedAnswer: { text: round.answers[1], source: "suggested", choiceIndex: 1 },
    });

    expect(selected.cells).toEqual(before.cells);
    expect(selected.occupancy.filter((item) => item.status === "clearing")).toHaveLength(2);
    expect(selected.occupancy.filter((item) => item.status === "selected")).toHaveLength(1);
  });

  it("projects different routes for different option sequences", () => {
    const scenario = mockDataset.scenarios[0];
    const makeHistory = (choiceIndex: 0 | 2): ReflectionStep[] => scenario.rounds.slice(0, 4).map((round, index) => ({
      round: index + 1,
      question: round.question,
      answer: round.answers[choiceIndex],
      answerSource: "suggested",
      choiceIndex,
    }));
    const upperPath = projectCanvas({
      dilemma: scenario.dilemma,
      history: makeHistory(0),
      currentRound: scenario.rounds[4],
      phase: "round-ready",
      selectedAnswer: null,
    });
    const lowerPath = projectCanvas({
      dilemma: scenario.dilemma,
      history: makeHistory(2),
      currentRound: scenario.rounds[4],
      phase: "round-ready",
      selectedAnswer: null,
    });
    const selectedCells = (projection: typeof upperPath) => projection.occupancy
      .filter((item) => item.kind === "answer")
      .map((item) => item.cellId);

    expect(selectedCells(upperPath)).not.toEqual(selectedCells(lowerPath));
    expect(upperPath.focusCellId).not.toBe(lowerPath.focusCellId);
    expect(projectCanvas({
      dilemma: scenario.dilemma,
      history: makeHistory(0),
      currentRound: scenario.rounds[4],
      phase: "round-ready",
      selectedAnswer: null,
    })).toEqual(upperPath);
  });
});
