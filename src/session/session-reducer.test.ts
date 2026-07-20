import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { sessionReducer } from "./session-reducer";
import { initialSessionState, type SessionState } from "./session-types";

const discoveries = mockDataset.scenarios[0].discoveries;
const ready = (): SessionState => {
  let state = sessionReducer(initialSessionState, { type: "OPEN_ENTRY" });
  state = sessionReducer(state, { type: "SUBMIT_DILEMMA", dilemma: "A dilemma", requestId: 1 });
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

  it("restart clears lens selection and invalidates the request", () => {
    const restarted = sessionReducer(sessionReducer(ready(), { type: "OPEN_LENS", lensIndex: 0 }), { type: "RESTART", requestId: 9 });
    expect(restarted).toMatchObject({ phase: "welcome", history: [], currentDiscovery: null, selectedLensIndex: null, activeRequestId: 9 });
  });
});
