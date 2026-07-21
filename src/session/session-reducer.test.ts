import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { sessionReducer } from "./session-reducer";
import { initialSessionState, type SessionState } from "./session-types";

const discoveries = mockDataset.scenarios[0].discoveries;
const ready = (): SessionState => {
  const state = sessionReducer(initialSessionState, { type: "SUBMIT_DILEMMA", dilemma: "A dilemma", requestId: 1 });
  return sessionReducer(state, { type: "DISCOVERY_LOADED", discovery: discoveries[0], requestId: 1 });
};

describe("session reducer discovery flow", () => {
  it("opens and switches lenses locally without committing history", () => {
    let state = ready();
    expect(state.phase).toBe("lens-ready");
    state = sessionReducer(state, { type: "OPEN_LENS", lensIndex: 0 });
    expect(state.phase).toBe("round-ready");
    state = sessionReducer(state, { type: "OPEN_LENS", lensIndex: 1 });
    expect(state.selectedLensIndex).toBe(1);
    state = sessionReducer(state, { type: "RETURN_TO_LENSES" });
    expect(state.phase).toBe("lens-ready");
    expect(state.history).toHaveLength(0);
  });

  it("commits only the chosen lens after an answer", () => {
    let state = sessionReducer(ready(), { type: "OPEN_LENS", lensIndex: 1 });
    state = sessionReducer(state, { type: "SELECT_ANSWER", answer: { text: discoveries[0].lenses[1].answers[2], source: "suggested", choiceIndex: 2 }, requestId: 2 });
    state = sessionReducer(state, { type: "NEXT_DISCOVERY_LOADED", discovery: discoveries[1], requestId: 2 });
    state = sessionReducer(state, { type: "COMMIT_SELECTION" });
    expect(state.history[0]).toMatchObject({ lensIndex: 1, lensTheme: discoveries[0].lenses[1].theme, choiceIndex: 2 });
    state = sessionReducer(state, { type: "TRANSITION_COMPLETE" });
    expect(state.phase).toBe("lens-ready");
    expect(state.currentDiscovery).toEqual(discoveries[1]);
  });

  it("ignores repeated selection after the first answer locks the phase", () => {
    let state = sessionReducer(ready(), { type: "OPEN_LENS", lensIndex: 0 });
    state = sessionReducer(state, { type: "SELECT_ANSWER", answer: { text: "First", source: "suggested", choiceIndex: 0 }, requestId: 2 });
    const repeated = sessionReducer(state, { type: "SELECT_ANSWER", answer: { text: "Second", source: "suggested", choiceIndex: 1 }, requestId: 3 });
    expect(repeated).toBe(state);
  });

  it("replaces a past choice and removes later history before resuming", () => {
    let committed = sessionReducer(ready(), { type: "OPEN_LENS", lensIndex: 0 });
    committed = sessionReducer(committed, { type: "SELECT_ANSWER", answer: { text: discoveries[0].lenses[0].answers[0], source: "suggested", choiceIndex: 0 }, requestId: 2 });
    committed = sessionReducer(committed, { type: "COMMIT_SELECTION" });
    const later = {
      ...committed,
      phase: "lens-ready" as const,
      history: [...committed.history, { ...committed.history[0], round: 2 }],
      currentDiscovery: discoveries[2],
    };
    const revised = sessionReducer(later, { type: "REVISE_HISTORY_SELECTION", stepIndex: 0, answer: { text: discoveries[0].lenses[0].answers[2], source: "suggested", choiceIndex: 2 }, requestId: 8 });
    expect(revised).toMatchObject({ phase: "transitioning", currentDiscovery: null, activeRequestId: 8 });
    expect(revised.history).toHaveLength(1);
    expect(revised.history[0]).toMatchObject({ answer: discoveries[0].lenses[0].answers[2], choiceIndex: 2 });
  });

  it("revises from the green finish offer, clears it, and resumes the new route", () => {
    const history = Array.from({ length: 4 }, (_, index) => ({
      round: index + 1,
      lensTheme: discoveries[index].lenses[0].theme,
      lensIndex: 0 as const,
      question: discoveries[index].lenses[0].question,
      answer: discoveries[index].lenses[0].answers[0],
      answerSource: "suggested" as const,
      choiceIndex: 0 as const,
      options: discoveries[index].lenses[0].answers,
    }));
    const offered = { ...ready(), phase: "finish-offered" as const, history, currentDiscovery: discoveries[4], activeRequestId: 7 };
    let revised = sessionReducer(offered, {
      type: "REVISE_HISTORY_SELECTION", stepIndex: 1,
      answer: { text: discoveries[1].lenses[0].answers[2], source: "suggested", choiceIndex: 2 }, requestId: 8,
    });
    expect(revised).toMatchObject({ phase: "transitioning", currentDiscovery: null, pendingDiscovery: null, skipNextFinishOffer: true });
    expect(revised.history).toHaveLength(2);

    revised = sessionReducer(revised, { type: "NEXT_DISCOVERY_LOADED", discovery: discoveries[2], requestId: 8 });
    revised = sessionReducer(revised, { type: "TRANSITION_COMPLETE" });
    expect(revised).toMatchObject({ phase: "lens-ready", currentDiscovery: discoveries[2], skipNextFinishOffer: false });
  });

  it("restart clears lens selection and invalidates the request", () => {
    const restarted = sessionReducer(sessionReducer(ready(), { type: "OPEN_LENS", lensIndex: 0 }), { type: "RESTART", requestId: 9 });
    expect(restarted).toMatchObject({ phase: "entering", history: [], currentDiscovery: null, selectedLensIndex: null, activeRequestId: 9 });
  });

  it("offers a finish lens after four answers and preserves the prepared next discovery", () => {
    const history = Array.from({ length: 4 }, (_, index) => ({
      round: index + 1,
      lensTheme: discoveries[index].lenses[0].theme,
      lensIndex: 0 as const,
      question: discoveries[index].lenses[0].question,
      answer: discoveries[index].lenses[0].answers[1],
      answerSource: "suggested" as const,
      choiceIndex: 1 as const,
    }));
    const state = sessionReducer({ ...ready(), history, phase: "transitioning", currentDiscovery: discoveries[3], transitionFinished: true, activeRequestId: 9 }, { type: "NEXT_DISCOVERY_LOADED", discovery: discoveries[4], requestId: 9 });
    expect(state.phase).toBe("finish-offered");
    expect(state.currentDiscovery).toEqual(discoveries[4]);
  });

  it("returns to the prepared next round when a four-round recap is dismissed", () => {
    const discovery = discoveries[4];
    const state = sessionReducer({ ...ready(), phase: "ending", history: Array.from({ length: 4 }, (_, index) => ({
      round: index + 1,
      lensTheme: discoveries[index].lenses[0].theme,
      lensIndex: 0 as const,
      question: discoveries[index].lenses[0].question,
      answer: discoveries[index].lenses[0].answers[0],
      answerSource: "suggested" as const,
      choiceIndex: 0 as const,
    })), currentDiscovery: discovery, summary: mockDataset.scenarios[0].summary }, { type: "DISMISS_SUMMARY" });
    expect(state).toMatchObject({ phase: "lens-ready", currentDiscovery: discovery, summary: null });
  });

  it("lets the smaller continuation bubble skip the recap and reveal prepared lenses", () => {
    const discovery = discoveries[4];
    const state = sessionReducer({ ...ready(), phase: "finish-offered", currentDiscovery: discovery }, { type: "CONTINUE_FROM_FINISH" });
    expect(state).toMatchObject({ phase: "lens-ready", currentDiscovery: discovery });
  });
});
