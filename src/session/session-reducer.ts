import type { SessionEvent, SessionState } from "./session-types";
import { createInitialSessionState } from "./session-types";

const revealPendingRound = (state: SessionState): SessionState => {
  if (!state.pendingRound) return { ...state, transitionFinished: true };

  const offerClarity = state.history.length >= 4 && state.pendingRound.suggestEnding && !state.extensionUsed;
  return {
    ...state,
    phase: offerClarity ? "clarity-offered" : "round-ready",
    currentRound: state.pendingRound,
    pendingRound: null,
    selectedAnswer: null,
    transitionFinished: false,
  };
};

export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "OPEN_ENTRY":
      return state.phase === "welcome" ? { ...state, phase: "entering" } : state;
    case "CANCEL_ENTRY":
      return state.phase === "entering" ? createInitialSessionState(state.activeRequestId) : state;
    case "SUBMIT_DILEMMA": {
      if (state.phase !== "entering") return state;
      const dilemma = event.dilemma.trim();
      if (!dilemma) return state;
      return { ...state, phase: "generating-round", dilemma, activeRequestId: event.requestId };
    }
    case "ROUND_LOADED":
      return state.phase === "generating-round" && event.requestId === state.activeRequestId
        ? { ...state, phase: "round-ready", currentRound: event.round, dataSource: "mock" }
        : state;
    case "OPEN_CUSTOM_ANSWER":
      return state.phase === "round-ready" ? { ...state, phase: "writing-custom-answer" } : state;
    case "CLOSE_CUSTOM_ANSWER":
      return state.phase === "writing-custom-answer" ? { ...state, phase: "round-ready" } : state;
    case "SELECT_ANSWER":
      return (state.phase === "round-ready" || state.phase === "writing-custom-answer") && state.currentRound
        ? {
            ...state,
            phase: "answer-selected",
            selectedAnswer: event.answer,
            pendingRound: null,
            transitionFinished: false,
            activeRequestId: event.requestId,
          }
        : state;
    case "NEXT_ROUND_LOADED": {
      if (event.requestId !== state.activeRequestId) return state;
      if (state.phase === "answer-selected") return { ...state, pendingRound: event.round };
      if (state.phase === "transitioning") {
        const withPending = { ...state, pendingRound: event.round };
        return state.transitionFinished ? revealPendingRound(withPending) : withPending;
      }
      return state;
    }
    case "COMMIT_SELECTION": {
      if (state.phase !== "answer-selected" || !state.selectedAnswer || !state.currentRound) return state;
      const step = {
        round: state.history.length + 1,
        question: state.currentRound.question,
        answer: state.selectedAnswer.text,
        answerSource: state.selectedAnswer.source,
        choiceIndex: state.selectedAnswer.choiceIndex,
      } as const;
      const history = [...state.history, step];
      const reachedCoreLimit = !state.extensionUsed && history.length >= 5;
      const finishedExtension = state.extensionUsed;
      const shouldSummarize = reachedCoreLimit || finishedExtension;
      return {
        ...state,
        phase: shouldSummarize ? "generating-summary" : "transitioning",
        history,
        currentRound: shouldSummarize ? null : state.currentRound,
        finishReason: finishedExtension ? "extension" : reachedCoreLimit ? "max_rounds" : state.finishReason,
      };
    }
    case "TRANSITION_COMPLETE":
      return state.phase === "transitioning" ? revealPendingRound(state) : state;
    case "CONTINUE_AFTER_CLARITY":
      return state.phase === "clarity-offered" ? { ...state, phase: "round-ready" } : state;
    case "REQUEST_FINISH":
      return (state.phase === "round-ready" || state.phase === "clarity-offered") && state.history.length >= 2
        ? {
            ...state,
            phase: "generating-summary",
            currentRound: null,
            pendingRound: null,
            selectedAnswer: null,
            finishReason: event.reason,
            activeRequestId: event.requestId,
          }
        : state;
    case "REQUEST_EXTENSION": {
      if (state.phase !== "ending" || state.extensionUsed || !state.summary) return state;
      const focus = event.focus.trim();
      if (!focus) return state;
      return {
        ...state,
        phase: "generating-round",
        summary: null,
        currentRound: null,
        pendingRound: null,
        selectedAnswer: null,
        extensionUsed: true,
        extensionFocus: focus,
        finishReason: null,
        activeRequestId: event.requestId,
      };
    }
    case "SUMMARY_LOADED":
      return state.phase === "generating-summary" && event.requestId === state.activeRequestId
        ? { ...state, phase: "ending", summary: event.summary, dataSource: "mock" }
        : state;
    case "RESTART":
      return createInitialSessionState(event.requestId);
  }
}
