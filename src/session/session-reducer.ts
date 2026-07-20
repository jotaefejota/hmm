import type { SessionEvent, SessionState } from "./session-types";
import { initialSessionState } from "./session-types";

export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "OPEN_ENTRY":
      return state.phase === "welcome" ? { ...state, phase: "entering" } : state;
    case "CANCEL_ENTRY":
      return state.phase === "entering" ? initialSessionState : state;
    case "SUBMIT_DILEMMA": {
      if (state.phase !== "entering") return state;
      const dilemma = event.dilemma.trim();
      if (!dilemma) return state;
      return { ...state, phase: "generating-round", dilemma };
    }
    case "ROUND_LOADED":
      return state.phase === "generating-round"
        ? { ...state, phase: "round-ready", currentRound: event.round, dataSource: "mock" }
        : state;
  }
}

