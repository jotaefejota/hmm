import type { ReflectionStep, SessionEvent, SessionState } from "./session-types";
import { createInitialSessionState } from "./session-types";
import { MAX_CORE_ROUNDS } from "../../shared/limits";

const activeLens = (state: SessionState) =>
  state.selectedLensIndex === null ? null : state.currentDiscovery?.lenses[state.selectedLensIndex] ?? null;

const committedStep = (state: SessionState): ReflectionStep | null => {
  const lens = activeLens(state);
  if (!lens || state.selectedLensIndex === null || !state.selectedAnswer) return null;
  return {
    round: state.history.length + 1,
    lensTheme: lens.theme,
    lensIndex: state.selectedLensIndex,
    question: lens.question,
    answer: state.selectedAnswer.text,
    answerSource: state.selectedAnswer.source,
    choiceIndex: state.selectedAnswer.choiceIndex,
  };
};

const revealPendingDiscovery = (state: SessionState): SessionState => {
  if (!state.pendingDiscovery) return { ...state, transitionFinished: true };
  const offerClarity = state.history.length >= 4 && state.pendingDiscovery.suggestEnding && !state.extensionUsed;
  return {
    ...state,
    phase: offerClarity ? "clarity-offered" : "lens-ready",
    currentDiscovery: state.pendingDiscovery,
    pendingDiscovery: null,
    selectedLensIndex: null,
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
      return dilemma ? { ...state, phase: "generating-round", dilemma, activeRequestId: event.requestId } : state;
    }
    case "DISCOVERY_LOADED":
      return state.phase === "generating-round" && event.requestId === state.activeRequestId
        ? { ...state, phase: "lens-ready", currentDiscovery: event.discovery, dataSource: "mock" }
        : state;
    case "OPEN_LENS":
      return (state.phase === "lens-ready" || state.phase === "round-ready") && state.currentDiscovery
        ? { ...state, phase: "round-ready", selectedLensIndex: event.lensIndex }
        : state;
    case "RETURN_TO_LENSES":
      return (state.phase === "round-ready" || state.phase === "writing-custom-answer") && state.currentDiscovery
        ? { ...state, phase: "lens-ready", selectedLensIndex: null, selectedAnswer: null }
        : state;
    case "OPEN_CUSTOM_ANSWER":
      return state.phase === "round-ready" ? { ...state, phase: "writing-custom-answer" } : state;
    case "CLOSE_CUSTOM_ANSWER":
      return state.phase === "writing-custom-answer" ? { ...state, phase: "round-ready" } : state;
    case "SELECT_ANSWER":
      return (state.phase === "round-ready" || state.phase === "writing-custom-answer") && activeLens(state)
        ? { ...state, phase: "answer-selected", selectedAnswer: event.answer, pendingDiscovery: null, transitionFinished: false, activeRequestId: event.requestId }
        : state;
    case "NEXT_DISCOVERY_LOADED": {
      if (event.requestId !== state.activeRequestId) return state;
      if (state.phase === "answer-selected") return { ...state, pendingDiscovery: event.discovery };
      if (state.phase === "transitioning") {
        const withPending = { ...state, pendingDiscovery: event.discovery };
        return state.transitionFinished ? revealPendingDiscovery(withPending) : withPending;
      }
      return state;
    }
    case "COMMIT_SELECTION": {
      if (state.phase !== "answer-selected") return state;
      const step = committedStep(state);
      if (!step) return state;
      const history = [...state.history, step];
      const reachedCoreLimit = !state.extensionUsed && history.length >= MAX_CORE_ROUNDS;
      const finishedExtension = state.extensionUsed;
      const shouldSummarize = reachedCoreLimit || finishedExtension;
      return {
        ...state,
        phase: shouldSummarize ? "generating-summary" : "transitioning",
        history,
        currentDiscovery: shouldSummarize ? null : state.currentDiscovery,
        selectedLensIndex: shouldSummarize ? null : state.selectedLensIndex,
        finishReason: finishedExtension ? "extension" : reachedCoreLimit ? "max_rounds" : state.finishReason,
      };
    }
    case "TRANSITION_COMPLETE":
      return state.phase === "transitioning" ? revealPendingDiscovery(state) : state;
    case "CONTINUE_AFTER_CLARITY":
      return state.phase === "clarity-offered" ? { ...state, phase: "lens-ready" } : state;
    case "REQUEST_FINISH":
      return (state.phase === "lens-ready" || state.phase === "round-ready" || state.phase === "clarity-offered") && state.history.length >= 2
        ? { ...state, phase: "generating-summary", currentDiscovery: null, pendingDiscovery: null, selectedLensIndex: null, selectedAnswer: null, finishReason: event.reason, activeRequestId: event.requestId }
        : state;
    case "REQUEST_EXTENSION": {
      if (state.phase !== "ending" || state.history.length >= MAX_CORE_ROUNDS || state.extensionUsed || !state.summary) return state;
      const focus = event.focus.trim();
      return focus ? {
        ...state, phase: "generating-round", summary: null, currentDiscovery: null, pendingDiscovery: null,
        selectedLensIndex: null, selectedAnswer: null, extensionUsed: true, extensionFocus: focus,
        finishReason: null, activeRequestId: event.requestId,
      } : state;
    }
    case "SUMMARY_LOADED":
      return state.phase === "generating-summary" && event.requestId === state.activeRequestId
        ? { ...state, phase: "ending", summary: event.summary, dataSource: "mock" }
        : state;
    case "REQUEST_FAILED": {
      if (event.requestId !== state.activeRequestId || state.phase === "error") return state;
      if (state.phase === "answer-selected") {
        const step = committedStep(state);
        if (step) return { ...state, phase: "error", history: [...state.history, step], currentDiscovery: null, selectedLensIndex: null, selectedAnswer: null, requestError: event.error, errorPhase: "transitioning" };
      }
      return { ...state, phase: "error", requestError: event.error, errorPhase: state.phase === "generating-round" || state.phase === "transitioning" || state.phase === "generating-summary" ? state.phase : null };
    }
    case "RECOVER_REQUEST":
      return state.phase === "error" && state.errorPhase
        ? { ...state, phase: state.errorPhase, requestError: null, errorPhase: null, activeRequestId: event.requestId }
        : state;
    case "RESTART":
      return createInitialSessionState(event.requestId);
  }
}
