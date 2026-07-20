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
    options: lens.answers.map((answer, index) => index === state.selectedAnswer!.choiceIndex ? state.selectedAnswer!.text : answer),
  };
};

const revealPendingDiscovery = (state: SessionState): SessionState => {
  if (!state.pendingDiscovery) return { ...state, transitionFinished: true };
  const offerFinish = state.history.length > 0 && state.history.length % 4 === 0 && !state.extensionUsed;
  return {
    ...state,
    phase: offerFinish ? "finish-offered" : "lens-ready",
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
    case "REVISE_HISTORY_SELECTION": {
      if ((state.phase !== "lens-ready" && state.phase !== "round-ready") || event.stepIndex < 0 || event.stepIndex >= state.history.length) return state;
      const previous = state.history[event.stepIndex];
      const revised = {
        ...previous,
        answer: event.answer.text,
        answerSource: event.answer.source,
        choiceIndex: event.answer.choiceIndex,
        options: (previous.options ?? []).map((option, index) => index === event.answer.choiceIndex ? event.answer.text : option),
      };
      const history = [...state.history.slice(0, event.stepIndex), revised];
      const reachedCoreLimit = history.length >= MAX_CORE_ROUNDS;
      return {
        ...state,
        phase: reachedCoreLimit ? "finish-offered" : "transitioning",
        history,
        currentDiscovery: null,
        pendingDiscovery: null,
        selectedLensIndex: null,
        selectedAnswer: null,
        summary: null,
        finishReason: reachedCoreLimit ? "max_rounds" : null,
        extensionUsed: false,
        extensionFocus: null,
        transitionFinished: false,
        activeRequestId: event.requestId,
      };
    }
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
      return {
        ...state,
        phase: reachedCoreLimit || finishedExtension ? "finish-offered" : "transitioning",
        history,
        currentDiscovery: reachedCoreLimit || finishedExtension ? null : state.currentDiscovery,
        selectedLensIndex: reachedCoreLimit || finishedExtension ? null : state.selectedLensIndex,
        finishReason: finishedExtension ? "extension" : reachedCoreLimit ? "max_rounds" : state.finishReason,
      };
    }
    case "TRANSITION_COMPLETE":
      return state.phase === "transitioning" ? revealPendingDiscovery(state) : state;
    case "CONTINUE_FROM_FINISH":
      return state.phase === "finish-offered" && state.currentDiscovery
        ? { ...state, phase: "lens-ready", selectedLensIndex: null, selectedAnswer: null }
        : state;
    case "DISMISS_SUMMARY":
      return state.phase === "ending" && state.currentDiscovery
        ? { ...state, phase: "lens-ready", summary: null, finishReason: null, selectedLensIndex: null, selectedAnswer: null }
        : state;
    case "REQUEST_FINISH":
      return (state.phase === "lens-ready" || state.phase === "round-ready" || state.phase === "finish-offered") && state.history.length >= 2
        ? { ...state, phase: "generating-summary", pendingDiscovery: null, selectedLensIndex: null, selectedAnswer: null, finishReason: event.reason, activeRequestId: event.requestId }
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
