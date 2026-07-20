import { describe, expect, it } from "vitest";
import { createInitialSessionState } from "./session-types";
import { selectProgress } from "./session-selectors";

describe("selectProgress", () => {
  it("derives answers and statuses without storing a second history", () => {
    const base = createInitialSessionState();
    const step = { round: 1, question: "Why?", answer: "Because it matters", answerSource: "custom" as const, choiceIndex: 1 as const };
    expect(selectProgress({ ...base, dilemma: "A question", phase: "round-ready" }).status).toBe("Starting out");
    expect(selectProgress({ ...base, dilemma: "A question", phase: "round-ready", history: [step] })).toMatchObject({ status: "Exploring", answers: ["Because it matters"] });
    expect(selectProgress({ ...base, dilemma: "A question", phase: "ending", history: [step] }).status).toBe("Ready to reflect");
    expect(selectProgress({
      ...base,
      dilemma: "A question",
      phase: "round-ready",
      history: [step, { ...step, round: 2 }],
      extensionUsed: true,
    }).status).toBe("Looking once more");
  });
});
