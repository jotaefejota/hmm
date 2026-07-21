import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { createInitialSessionState } from "./session-types";
import { selectCanExtend, selectProgress } from "./session-selectors";

describe("selectProgress", () => {
  it("derives answers and statuses without storing a second history", () => {
    const base = createInitialSessionState();
    const step = { round: 1, lensTheme: "What matters?", lensIndex: 0 as const, question: "Why?", answer: "Because it matters", answerSource: "custom" as const, choiceIndex: 1 as const };
    expect(selectProgress({ ...base, dilemma: "A question", phase: "round-ready" }).status).toBe("Starting out");
    expect(selectProgress({ ...base, dilemma: "A question", phase: "round-ready", history: [step] })).toMatchObject({ status: "Exploring", answers: ["Because it matters"] });
    expect(selectProgress({ ...base, dilemma: "A question", phase: "transitioning", history: [step], pendingDiscovery: mockDataset.scenarios[0].discoveries[1] }))
      .toMatchObject({ status: mockDataset.scenarios[0].discoveries[1].transition, isThinking: true });
    expect(selectProgress({ ...base, dilemma: "A question", phase: "generating-summary", history: [step] }))
      .toMatchObject({ status: "Let me gather the thread…", isThinking: true });
    expect(selectProgress({ ...base, dilemma: "A question", phase: "ending", history: [step] }).status).toBe("A reflection is ready");
    expect(selectProgress({
      ...base,
      dilemma: "A question",
      phase: "round-ready",
      history: [step, { ...step, round: 2 }],
      extensionUsed: true,
    }).status).toBe("Looking once more");
  });
});

describe("selectCanExtend", () => {
  const step = { round: 1, lensTheme: "What matters?", lensIndex: 0 as const, question: "Why?", answer: "Because", answerSource: "suggested" as const, choiceIndex: 0 as const };
  const summary = {
    kind: "summary" as const,
    direction: "A direction is forming.",
    reasons: ["One reason.", "Another reason."],
    doubts: ["One doubt remains."],
    nextStep: "Ask one question.",
  };

  it("offers one extension after either a four- or five-answer core ending", () => {
    const base = createInitialSessionState();
    const fourSteps = Array.from({ length: 4 }, (_, index) => ({ ...step, round: index + 1 }));
    const fiveSteps = [...fourSteps, { ...step, round: 5 }];

    expect(selectCanExtend({ ...base, phase: "ending", history: fourSteps, summary })).toBe(true);
    expect(selectCanExtend({ ...base, phase: "ending", history: fiveSteps, summary })).toBe(true);
    expect(selectCanExtend({ ...base, phase: "ending", history: fiveSteps, summary, extensionUsed: true })).toBe(false);
  });
});
