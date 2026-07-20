import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { sessionReducer } from "./session-reducer";
import { initialSessionState } from "./session-types";
import type { SessionState } from "./session-types";

const rounds = mockDataset.scenarios[0].rounds;

const readyAtFirstRound = (): SessionState => {
  const entering = sessionReducer(initialSessionState, { type: "OPEN_ENTRY" });
  const generating = sessionReducer(entering, { type: "SUBMIT_DILEMMA", dilemma: "A real question?", requestId: 1 });
  return sessionReducer(generating, { type: "ROUND_LOADED", round: rounds[0], requestId: 1 });
};

const completeRound = (state: SessionState, answerIndex: number, requestId: number, nextRoundIndex: number) => {
  const selected = sessionReducer(state, {
    type: "SELECT_ANSWER",
    answer: { text: state.currentRound!.answers[answerIndex], source: "suggested", choiceIndex: answerIndex as 0 | 1 | 2 },
    requestId,
  });
  const loaded = sessionReducer(selected, { type: "NEXT_ROUND_LOADED", round: rounds[nextRoundIndex], requestId });
  const committed = sessionReducer(loaded, { type: "COMMIT_SELECTION" });
  return sessionReducer(committed, { type: "TRANSITION_COMPLETE" });
};

describe("sessionReducer", () => {
  it("moves through welcome, entry, generation, and first round", () => {
    const ready = readyAtFirstRound();
    expect(ready).toMatchObject({ phase: "round-ready", dataSource: "mock", activeRequestId: 1 });
  });

  it("rejects whitespace, duplicate selections, duplicate commits, and stale responses", () => {
    const entering = sessionReducer(initialSessionState, { type: "OPEN_ENTRY" });
    expect(sessionReducer(entering, { type: "SUBMIT_DILEMMA", dilemma: "   ", requestId: 1 })).toBe(entering);

    const ready = readyAtFirstRound();
    const selected = sessionReducer(ready, {
      type: "SELECT_ANSWER",
      answer: { text: rounds[0].answers[0], source: "suggested", choiceIndex: 0 },
      requestId: 2,
    });
    const repeated = sessionReducer(selected, {
      type: "SELECT_ANSWER",
      answer: { text: rounds[0].answers[1], source: "suggested", choiceIndex: 1 },
      requestId: 3,
    });
    expect(repeated).toBe(selected);
    expect(sessionReducer(selected, { type: "NEXT_ROUND_LOADED", round: rounds[1], requestId: 99 })).toBe(selected);

    const committed = sessionReducer(selected, { type: "COMMIT_SELECTION" });
    expect(committed.history).toHaveLength(1);
    expect(sessionReducer(committed, { type: "COMMIT_SELECTION" })).toBe(committed);
  });

  it("completes four rounds, offers clarity, and can continue to the fifth-round limit", () => {
    let state = readyAtFirstRound();
    state = completeRound(state, 0, 2, 1);
    state = completeRound(state, 0, 3, 2);
    state = completeRound(state, 0, 4, 3);
    state = completeRound(state, 0, 5, 4);

    expect(state.phase).toBe("clarity-offered");
    expect(state.history).toHaveLength(4);

    state = sessionReducer(state, { type: "CONTINUE_AFTER_CLARITY" });
    state = sessionReducer(state, {
      type: "SELECT_ANSWER",
      answer: { text: rounds[4].answers[0], source: "suggested", choiceIndex: 0 },
      requestId: 6,
    });
    state = sessionReducer(state, { type: "COMMIT_SELECTION" });
    expect(state).toMatchObject({ phase: "generating-summary", finishReason: "max_rounds" });
    expect(state.history).toHaveLength(5);
  });

  it("allows an early finish after two answers and rejects it before then", () => {
    let state = readyAtFirstRound();
    expect(sessionReducer(state, { type: "REQUEST_FINISH", reason: "user", requestId: 2 })).toBe(state);
    state = completeRound(state, 0, 2, 1);
    state = completeRound(state, 0, 3, 2);
    state = sessionReducer(state, { type: "REQUEST_FINISH", reason: "user", requestId: 4 });
    expect(state).toMatchObject({ phase: "generating-summary", finishReason: "user", activeRequestId: 4 });
  });

  it("commits a custom answer through the same guarded path", () => {
    let state = readyAtFirstRound();
    state = sessionReducer(state, { type: "OPEN_CUSTOM_ANSWER" });
    state = sessionReducer(state, {
      type: "SELECT_ANSWER",
      answer: { text: "The chance to mentor", source: "custom", choiceIndex: 1 },
      requestId: 2,
    });
    state = sessionReducer(state, { type: "COMMIT_SELECTION" });
    expect(state.history[0]).toMatchObject({ answer: "The chance to mentor", answerSource: "custom" });
  });

  it("restart clears the session and makes an old response harmless", () => {
    const selected = sessionReducer(readyAtFirstRound(), {
      type: "SELECT_ANSWER",
      answer: { text: rounds[0].answers[0], source: "suggested", choiceIndex: 0 },
      requestId: 2,
    });
    const restarted = sessionReducer(selected, { type: "RESTART", requestId: 3 });
    const stale = sessionReducer(restarted, { type: "NEXT_ROUND_LOADED", round: rounds[1], requestId: 2 });
    expect(stale).toBe(restarted);
    expect(restarted).toMatchObject({ phase: "welcome", history: [], activeRequestId: 3 });
  });

  it("owns request failures and ignores stale errors", () => {
    const generating = sessionReducer(
      sessionReducer(initialSessionState, { type: "OPEN_ENTRY" }),
      { type: "SUBMIT_DILEMMA", dilemma: "A real question?", requestId: 4 },
    );
    const error = {
      kind: "error" as const,
      code: "AI_REFUSAL" as const,
      message: "This topic needs a different kind of support.",
      retryable: false,
      fallbackAvailable: false,
    };

    expect(sessionReducer(generating, { type: "REQUEST_FAILED", error, requestId: 3 })).toBe(generating);
    expect(sessionReducer(generating, { type: "REQUEST_FAILED", error, requestId: 4 })).toMatchObject({
      phase: "error",
      dilemma: "A real question?",
      requestError: error,
      errorPhase: "generating-round",
    });
  });

  it("restores the exact pre-error phase for a request-scoped recovery", () => {
    let state = readyAtFirstRound();
    state = completeRound(state, 0, 2, 1);
    state = sessionReducer(state, {
      type: "SELECT_ANSWER",
      answer: { text: rounds[1].answers[0], source: "suggested", choiceIndex: 0 },
      requestId: 3,
    });
    state = sessionReducer(state, { type: "COMMIT_SELECTION" });
    state = sessionReducer(state, { type: "TRANSITION_COMPLETE" });
    const error = {
      kind: "error" as const,
      code: "AI_TIMEOUT" as const,
      message: "The live response took too long.",
      retryable: true,
      fallbackAvailable: true,
    };

    state = sessionReducer(state, { type: "REQUEST_FAILED", error, requestId: 3 });
    expect(state).toMatchObject({ phase: "error", errorPhase: "transitioning" });
    expect(state.history).toHaveLength(2);

    state = sessionReducer(state, { type: "RECOVER_REQUEST", requestId: 4 });
    expect(state).toMatchObject({
      phase: "transitioning",
      requestError: null,
      errorPhase: null,
      activeRequestId: 4,
    });
    expect(state.history).toHaveLength(2);
  });

  it("commits a clicked answer even when the next request fails before animation completion", () => {
    const selected = sessionReducer(readyAtFirstRound(), {
      type: "SELECT_ANSWER",
      answer: { text: rounds[0].answers[1], source: "suggested", choiceIndex: 1 },
      requestId: 2,
    });
    const error = {
      kind: "error" as const,
      code: "AI_TIMEOUT" as const,
      message: "The live response took too long.",
      retryable: true,
      fallbackAvailable: true,
    };

    const failed = sessionReducer(selected, { type: "REQUEST_FAILED", error, requestId: 2 });
    expect(failed).toMatchObject({
      phase: "error",
      errorPhase: "transitioning",
      currentRound: null,
      selectedAnswer: null,
    });
    expect(failed.history).toEqual([expect.objectContaining({ answer: rounds[0].answers[1], choiceIndex: 1 })]);
  });

  it("allows exactly one post-ending extension then regenerates the summary", () => {
    let state = readyAtFirstRound();
    state = completeRound(state, 0, 2, 1);
    state = completeRound(state, 0, 3, 2);
    state = sessionReducer(state, { type: "REQUEST_FINISH", reason: "user", requestId: 4 });
    state = sessionReducer(state, {
      type: "SUMMARY_LOADED",
      summary: mockDataset.scenarios[0].summary,
      requestId: 4,
    });
    expect(state.phase).toBe("ending");

    const focus = mockDataset.scenarios[0].summary.doubts[0];
    state = sessionReducer(state, { type: "REQUEST_EXTENSION", focus, requestId: 5 });
    expect(state).toMatchObject({
      phase: "generating-round",
      extensionUsed: true,
      extensionFocus: focus,
      summary: null,
    });

    state = sessionReducer(state, {
      type: "ROUND_LOADED",
      round: {
        kind: "round",
        question: "What would make that remaining doubt feel clearer?",
        answers: ["A concrete conversation", "A small time-boxed test", "More information first"],
        transition: "Let’s look at that doubt once more.",
        suggestEnding: false,
      },
      requestId: 5,
    });
    state = sessionReducer(state, {
      type: "SELECT_ANSWER",
      answer: { text: "A concrete conversation", source: "suggested", choiceIndex: 0 },
      requestId: 6,
    });
    state = sessionReducer(state, { type: "COMMIT_SELECTION" });
    expect(state).toMatchObject({ phase: "generating-summary", finishReason: "extension" });
    expect(state.history).toHaveLength(3);

    state = sessionReducer(state, {
      type: "SUMMARY_LOADED",
      summary: mockDataset.scenarios[0].summary,
      requestId: 6,
    });
    expect(sessionReducer(state, { type: "REQUEST_EXTENSION", focus, requestId: 7 })).toBe(state);
  });
});
