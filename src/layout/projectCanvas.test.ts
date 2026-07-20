import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import type { ReflectionStep } from "../session/session-types";
import { projectCanvas } from "./projectCanvas";

const discovery = mockDataset.scenarios[0].discoveries[0];
const step = (lensIndex: 0 | 1, choiceIndex: 0 | 1 | 2): ReflectionStep => ({
  round: 1,
  lensTheme: discovery.lenses[lensIndex].theme,
  lensIndex,
  question: discovery.lenses[lensIndex].question,
  answer: discovery.lenses[lensIndex].answers[choiceIndex],
  answerSource: "suggested",
  choiceIndex,
  options: discovery.lenses[lensIndex].answers,
});

describe("projectCanvas discovery", () => {
  it("shows exactly two interactive lenses before a question opens", () => {
    const projection = projectCanvas({ dilemma: "A dilemma", history: [], currentDiscovery: discovery, selectedLensIndex: null, phase: "lens-ready", selectedAnswer: null });
    expect(projection.occupancy.filter((item) => item.kind === "lens")).toHaveLength(2);
    expect(projection.occupancy.filter((item) => item.kind === "suggestion")).toHaveLength(0);
  });

  it("transforms the chosen lens into one question with three suggestions", () => {
    const projection = projectCanvas({ dilemma: "A dilemma", history: [], currentDiscovery: discovery, selectedLensIndex: 1, phase: "round-ready", selectedAnswer: null });
    expect(projection.occupancy.filter((item) => item.kind === "lens")).toHaveLength(0);
    expect(projection.occupancy.filter((item) => item.kind === "question" && item.status === "active")).toHaveLength(1);
    expect(projection.occupancy.filter((item) => item.kind === "suggestion")).toHaveLength(3);
  });

  it("settles committed history into one larger decision without discarding its semantic pair", () => {
    const projection = projectCanvas({ dilemma: "A dilemma", history: [step(0, 2)], currentDiscovery: mockDataset.scenarios[0].discoveries[1], selectedLensIndex: null, phase: "lens-ready", selectedAnswer: null });
    const history = projection.occupancy.filter((item) => item.stepIndex === 0);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ kind: "decision", text: step(0, 2).answer, interactive: true });
    expect(new Set(projection.occupancy.map((item) => item.cellId)).size).toBe(projection.occupancy.length);
  });

  it("unfolds one settled decision into its question and all three original options", () => {
    const projection = projectCanvas({
      dilemma: "A dilemma", history: [step(0, 2)], currentDiscovery: mockDataset.scenarios[0].discoveries[1],
      selectedLensIndex: null, phase: "lens-ready", selectedAnswer: null, expandedDecisionStepIndex: 0,
    });
    const history = projection.occupancy.filter((item) => item.stepIndex === 0);
    expect(history.map((item) => item.kind)).toEqual(["question", "suggestion", "suggestion", "answer"]);
    expect(history.every((item) => item.interactive)).toBe(true);
  });

  it("produces different trail cells for different lens choices", () => {
    const upper = projectCanvas({ dilemma: "A dilemma", history: [step(0, 1)], currentDiscovery: null, selectedLensIndex: null, phase: "ending", selectedAnswer: null });
    const lower = projectCanvas({ dilemma: "A dilemma", history: [step(1, 1)], currentDiscovery: null, selectedLensIndex: null, phase: "ending", selectedAnswer: null });
    expect(upper.occupancy.find((item) => item.kind === "decision")?.cellId)
      .not.toBe(lower.occupancy.find((item) => item.kind === "decision")?.cellId);
    expect(upper.cells).toBe(lower.cells);
  });

  it("adds one tappable reflection lens beside the fourth answer", () => {
    const fourthHistory = Array.from({ length: 4 }, (_, index) => ({ ...step(0, 1), round: index + 1 }));
    const projection = projectCanvas({ dilemma: "A dilemma", history: fourthHistory, currentDiscovery: discovery, selectedLensIndex: null, phase: "finish-offered", selectedAnswer: null });
    const finish = projection.occupancy.filter((item) => item.kind === "finish");
    expect(finish).toHaveLength(1);
    expect(finish[0]).toMatchObject({ interactive: true, label: "Reflection lens" });
  });
});
