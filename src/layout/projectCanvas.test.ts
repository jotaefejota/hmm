import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import type { ReflectionStep } from "../session/session-types";
import { projectCanvas, shouldShowFortune } from "./projectCanvas";

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
  it("shows fortunes sparsely in stable, randomized round windows", () => {
    const seed = 5;
    expect(shouldShowFortune(1, seed)).toBe(false);
    expect([2, 3, 4].filter((round) => shouldShowFortune(round, seed))).toHaveLength(1);
    expect([5, 6, 7].filter((round) => shouldShowFortune(round, seed))).toHaveLength(1);
    expect([8, 9].filter((round) => shouldShowFortune(round, seed))).toHaveLength(1);
    expect([10, 11].filter((round) => shouldShowFortune(round, seed))).toHaveLength(1);
    expect(shouldShowFortune(4, seed)).toBe(shouldShowFortune(4, seed));
  });

  it("shows exactly two interactive lenses before a question opens", () => {
    const projection = projectCanvas({ dilemma: "A dilemma", history: [], currentDiscovery: discovery, selectedLensIndex: null, phase: "lens-ready", selectedAnswer: null });
    expect(projection.occupancy.filter((item) => item.kind === "lens")).toHaveLength(2);
    expect(projection.occupancy.filter((item) => item.kind === "suggestion")).toHaveLength(0);
  });

  it("transforms the chosen lens into one question, three suggestions, and a custom-answer bubble", () => {
    const projection = projectCanvas({ dilemma: "A dilemma", history: [], currentDiscovery: discovery, selectedLensIndex: 1, phase: "round-ready", selectedAnswer: null });
    expect(projection.occupancy.filter((item) => item.kind === "lens")).toHaveLength(0);
    expect(projection.occupancy.filter((item) => item.kind === "question" && item.status === "active")).toHaveLength(1);
    expect(projection.occupancy.filter((item) => item.kind === "suggestion")).toHaveLength(3);
    expect(projection.occupancy.filter((item) => item.kind === "custom")).toMatchObject([
      { text: "Enter your own answer…", label: "Possibility", interactive: true },
    ]);
  });

  it("warms the two deterministic next lens cells while a route is transitioning", () => {
    const projection = projectCanvas({
      dilemma: "A dilemma", history: [step(1, 2)], currentDiscovery: null,
      selectedLensIndex: null, phase: "transitioning", selectedAnswer: null,
    });
    const previews = projection.occupancy.filter((item) => item.kind === "preview");

    expect(previews).toHaveLength(2);
    expect(previews.every((item) => !item.interactive && !item.text)).toBe(true);
  });

  it("loads the first grid directly and warms two textless lens cells", () => {
    const projection = projectCanvas({
      dilemma: "A dilemma", history: [], currentDiscovery: null,
      selectedLensIndex: null, phase: "generating-round", selectedAnswer: null,
    });
    const previews = projection.occupancy.filter((item) => item.kind === "preview");

    expect(projection.occupancy.find((item) => item.kind === "dilemma")).toMatchObject({ text: "A dilemma", label: "" });
    expect(previews).toHaveLength(2);
    expect(previews.every((item) => !item.interactive && !item.text)).toBe(true);
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
    expect(history.map((item) => item.kind)).toEqual(["question", "suggestion", "suggestion", "suggestion"]);
    expect(history[0]).toMatchObject({ status: "active", label: step(0, 2).lensTheme });
    expect(history[3]).toMatchObject({ status: "selected", label: "Your answer" });
    expect(history.every((item) => item.interactive)).toBe(true);
    expect(projection.frameCellIds).toEqual(history.map((item) => item.cellId));
    expect(projection.focusCellId).toBe(history[0].cellId);
  });

  it("suppresses the live question and three answers while a historical decision unfolds", () => {
    const projection = projectCanvas({
      dilemma: "A dilemma", history: [step(0, 2)], currentDiscovery: mockDataset.scenarios[0].discoveries[1],
      selectedLensIndex: 1, phase: "round-ready", selectedAnswer: null, expandedDecisionStepIndex: 0, suppressCurrentDiscovery: true,
    });
    expect(projection.occupancy.some((item) => item.semanticId === "question-2")).toBe(false);
    expect(projection.occupancy.filter((item) => item.kind === "suggestion" && item.stepIndex === undefined)).toHaveLength(0);
    expect(projection.occupancy.filter((item) => item.stepIndex === 0).map((item) => item.kind))
      .toEqual(["question", "suggestion", "suggestion", "suggestion"]);
  });

  it("suppresses the next lens pair while a historical decision unfolds", () => {
    const projection = projectCanvas({
      dilemma: "A dilemma", history: [step(0, 2)], currentDiscovery: mockDataset.scenarios[0].discoveries[1],
      selectedLensIndex: null, phase: "lens-ready", selectedAnswer: null, expandedDecisionStepIndex: 0, suppressCurrentDiscovery: true,
    });

    expect(projection.occupancy.filter((item) => item.kind === "lens")).toHaveLength(0);
    expect(projection.occupancy.filter((item) => item.stepIndex === 0).map((item) => item.kind))
      .toEqual(["question", "suggestion", "suggestion", "suggestion"]);
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
    expect(finish[0]).toMatchObject({ interactive: true, label: "Something is taking shape", text: "Discover" });
  });

  it("removes the reflection lens while a revised fourth-round route is resuming", () => {
    const revisedHistory = Array.from({ length: 4 }, (_, index) => ({ ...step(0, 1), round: index + 1 }));
    const projection = projectCanvas({
      dilemma: "A dilemma", history: revisedHistory, currentDiscovery: null,
      selectedLensIndex: null, phase: "transitioning", selectedAnswer: null,
    });

    expect(projection.occupancy.filter((item) => item.kind === "finish")).toHaveLength(0);
    expect(projection.occupancy.filter((item) => item.kind === "continue")).toHaveLength(0);
  });

  it("keeps the finish lens addressable after one sixth-round extension", () => {
    const extensionHistory = Array.from({ length: 6 }, (_, index) => ({ ...step(0, 1), round: index + 1 }));
    const projection = projectCanvas({
      dilemma: "A dilemma", history: extensionHistory, currentDiscovery: null,
      selectedLensIndex: null, phase: "finish-offered", selectedAnswer: null,
    });
    expect(projection.occupancy.filter((item) => item.kind === "finish")).toHaveLength(1);
    expect(projection.focusCellId).toBe(projection.occupancy.find((item) => item.kind === "finish")?.cellId);
  });

});
