import { useEffect, useReducer, useRef, useState } from "react";
import { AppShell } from "./AppShell";
import { reflectionProvider } from "../services/resilient-provider";
import { MockReflectionProvider } from "../services/mock-provider";
import { ReflectionProviderError } from "../services/reflection-provider";
import type { ContentNotice, ReflectionProvider } from "../services/reflection-provider";
import { sessionReducer } from "../session/session-reducer";
import { initialSessionState } from "../session/session-types";
import type { FinishReason, ReflectionStep, SelectedAnswer } from "../session/session-types";
import { MAX_CORE_ROUNDS } from "../../shared/limits";
import { roundRequestSchema, summaryRequestSchema } from "../../shared/ai-contract";
import type { RoundRequest, SummaryRequest } from "../../shared/ai-contract";

const MINIMUM_GENERATION_MS = 420;
const provider = reflectionProvider;
const preparedProvider = new MockReflectionProvider();
const pause = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));
const wasAborted = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
const toContractHistory = (history: ReflectionStep[]) => history.map((step) => ({
  round: step.round,
  lensTheme: step.lensTheme,
  lensIndex: step.lensIndex,
  question: step.question,
  answer: step.answer,
    answerSource: step.answerSource,
}));

type FailedOperation =
  | { kind: "round"; request: RoundRequest; success: "DISCOVERY_LOADED" | "NEXT_DISCOVERY_LOADED" }
  | { kind: "summary"; request: SummaryRequest };

const simulatedFailure = () => {
  if (!import.meta.env.DEV) return null;
  const simulation = new URLSearchParams(window.location.search).get("simulateError");
  if (simulation === "timeout") {
    return new ReflectionProviderError({
      kind: "error",
      code: "AI_TIMEOUT",
      message: "The live response took too long.",
      retryable: true,
      fallbackAvailable: true,
    });
  }
  if (simulation === "refusal") {
    return new ReflectionProviderError({
      kind: "error",
      code: "AI_REFUSAL",
      message: "This topic needs a different kind of support.",
      retryable: false,
      fallbackAvailable: false,
    });
  }
  return null;
};

export function App() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const [notice, setNotice] = useState<ContentNotice | null>(null);
  const requestCounter = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const selectionLocked = useRef(false);
  const failedOperation = useRef<FailedOperation | null>(null);

  useEffect(() => {
    if (state.phase === "round-ready" || state.phase === "lens-ready") selectionLocked.current = false;
  }, [state.phase]);

  const beginRequest = () => {
    abortController.current?.abort();
    abortController.current = new AbortController();
    requestCounter.current += 1;
    return { requestId: requestCounter.current, signal: abortController.current.signal };
  };

  const rememberResult = (source: "live" | "mock", nextNotice?: ContentNotice) => {
    if (nextNotice) setNotice(nextNotice);
    return source;
  };

  const reportRequestFailure = (error: unknown, requestId: number, operation: FailedOperation) => {
    if (wasAborted(error)) return;
    if (requestId !== requestCounter.current) return;
    const publicError = error instanceof ReflectionProviderError
      ? error.publicError
      : {
          kind: "error" as const,
          code: "AI_UNAVAILABLE" as const,
          message: "Reflection is unavailable right now.",
          retryable: true,
          fallbackAvailable: true,
        };
    failedOperation.current = operation;
    dispatch({ type: "REQUEST_FAILED", error: publicError, requestId });
  };

  const requestRound = async (
    operation: Extract<FailedOperation, { kind: "round" }>,
    source: ReflectionProvider,
    requestId: number,
    signal: AbortSignal,
  ) => {
    try {
      if (source === provider) {
        const failure = simulatedFailure();
        if (failure) throw failure;
      }
      const result = await source.getRound(operation.request, signal);
      rememberResult(result.source, result.notice);
      failedOperation.current = null;
      dispatch({ type: operation.success, discovery: result.data, requestId });
    } catch (error) {
      reportRequestFailure(error, requestId, operation);
    }
  };

  const requestSummary = async (
    operation: Extract<FailedOperation, { kind: "summary" }>,
    source: ReflectionProvider,
    requestId: number,
    signal: AbortSignal,
  ) => {
    try {
      if (source === provider) {
        const failure = simulatedFailure();
        if (failure) throw failure;
      }
      const result = await source.getSummary(operation.request, signal);
      rememberResult(result.source, result.notice);
      failedOperation.current = null;
      dispatch({ type: "SUMMARY_LOADED", summary: result.data, requestId });
    } catch (error) {
      reportRequestFailure(error, requestId, operation);
    }
  };

  const submitDilemma = async (dilemma: string) => {
    if (state.phase !== "entering") return;
    const { requestId, signal } = beginRequest();
    dispatch({ type: "SUBMIT_DILEMMA", dilemma, requestId });
    const request = roundRequestSchema.parse({
      contractVersion: "2",
      kind: "round",
      dilemma: dilemma.trim(),
      roundNumber: 1,
      requestMode: "core",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: [],
      focus: null,
    });
    const operation = { kind: "round" as const, request, success: "DISCOVERY_LOADED" as const };

    try {
      const failure = simulatedFailure();
      if (failure) throw failure;
      const [result] = await Promise.all([
        provider.getRound(request, signal),
        pause(MINIMUM_GENERATION_MS),
      ]);
      rememberResult(result.source, result.notice);
      dispatch({ type: "DISCOVERY_LOADED", discovery: result.data, requestId });
    } catch (error) {
      reportRequestFailure(error, requestId, operation);
    }
  };

  const loadExtensionRound = async (focus: string, requestId: number, history: ReflectionStep[]) => {
    const signal = abortController.current?.signal;
    const request = roundRequestSchema.parse({
      contractVersion: "2",
      kind: "round",
      dilemma: state.dilemma,
      roundNumber: 6,
      requestMode: "extension",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: toContractHistory(history),
      focus,
    });
    const operation = { kind: "round" as const, request, success: "DISCOVERY_LOADED" as const };

    try {
      const failure = simulatedFailure();
      if (failure) throw failure;
      const [result] = await Promise.all([
        provider.getRound(request, signal),
        pause(MINIMUM_GENERATION_MS),
      ]);
      rememberResult(result.source, result.notice);
      dispatch({ type: "DISCOVERY_LOADED", discovery: result.data, requestId });
    } catch (error) {
      reportRequestFailure(error, requestId, operation);
    }
  };

  const selectAnswer = async (answer: SelectedAnswer) => {
    if (
      selectionLocked.current ||
      (state.phase !== "round-ready" && state.phase !== "writing-custom-answer") ||
      !state.currentDiscovery || state.selectedLensIndex === null
    ) return;

    selectionLocked.current = true;
    const { requestId, signal } = beginRequest();
    const selectedLens = state.currentDiscovery.lenses[state.selectedLensIndex];
    const completedStep: ReflectionStep = {
      round: state.history.length + 1,
      lensTheme: selectedLens.theme,
      lensIndex: state.selectedLensIndex,
      question: selectedLens.question,
      answer: answer.text,
      answerSource: answer.source,
      choiceIndex: answer.choiceIndex,
      options: selectedLens.answers.map((option, index) => index === answer.choiceIndex ? answer.text : option),
    };
    const nextHistory = [...state.history, completedStep];
    dispatch({ type: "SELECT_ANSWER", answer, requestId });

    if (state.extensionUsed || nextHistory.length >= MAX_CORE_ROUNDS) return;

    const request = roundRequestSchema.parse({
      contractVersion: "2",
      kind: "round",
      dilemma: state.dilemma,
      roundNumber: nextHistory.length + 1,
      requestMode: "core",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: toContractHistory(nextHistory),
      focus: null,
    });
    const operation = { kind: "round" as const, request, success: "NEXT_DISCOVERY_LOADED" as const };

    try {
      const failure = simulatedFailure();
      if (failure) throw failure;
      const result = await provider.getRound(request, signal);
      rememberResult(result.source, result.notice);
      dispatch({ type: "NEXT_DISCOVERY_LOADED", discovery: result.data, requestId });
    } catch (error) {
      reportRequestFailure(error, requestId, operation);
    }
  };

  const reviseHistorySelection = async (stepIndex: number, choiceIndex: 0 | 1 | 2) => {
    if (selectionLocked.current || (state.phase !== "lens-ready" && state.phase !== "round-ready")) return;
    const step = state.history[stepIndex];
    const options = step?.options;
    const text = options?.[choiceIndex];
    if (!step || !text || text === step.answer) return;

    selectionLocked.current = true;
    const { requestId, signal } = beginRequest();
    const revisedStep: ReflectionStep = {
      ...step,
      answer: text,
      answerSource: "suggested",
      choiceIndex,
      options: options.map((option, index) => index === choiceIndex ? text : option),
    };
    const history = [...state.history.slice(0, stepIndex), revisedStep];
    dispatch({ type: "REVISE_HISTORY_SELECTION", stepIndex, answer: { text, source: "suggested", choiceIndex }, requestId });

    if (history.length >= MAX_CORE_ROUNDS) return;
    const request = roundRequestSchema.parse({
      contractVersion: "2",
      kind: "round",
      dilemma: state.dilemma,
      roundNumber: history.length + 1,
      requestMode: "core",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: toContractHistory(history),
      focus: null,
    });
    const operation = { kind: "round" as const, request, success: "NEXT_DISCOVERY_LOADED" as const };
    void requestRound(operation, provider, requestId, signal);
  };

  const loadSummary = async (
    history: ReflectionStep[],
    reason: FinishReason,
    requestId: number,
  ) => {
    const signal = abortController.current?.signal;
    const request = summaryRequestSchema.parse({
      contractVersion: "2",
      kind: "summary",
      dilemma: state.dilemma,
      history: toContractHistory(history),
      finishReason: reason,
    });
    const operation = { kind: "summary" as const, request };

    try {
      const failure = simulatedFailure();
      if (failure) throw failure;
      const [result] = await Promise.all([
        provider.getSummary(request, signal),
        pause(MINIMUM_GENERATION_MS),
      ]);
      rememberResult(result.source, result.notice);
      dispatch({ type: "SUMMARY_LOADED", summary: result.data, requestId });
    } catch (error) {
      reportRequestFailure(error, requestId, operation);
    }
  };

  const commitSelection = () => {
    if (state.phase !== "answer-selected" || !state.currentDiscovery || state.selectedLensIndex === null || !state.selectedAnswer) return;
    dispatch({ type: "COMMIT_SELECTION" });
  };

  const finish = (reason: "user" | "suggested") => {
    if (state.history.length < 2 || (state.extensionUsed && state.phase !== "finish-offered")) return;
    const { requestId } = beginRequest();
    dispatch({ type: "REQUEST_FINISH", reason, requestId });
    void loadSummary(state.history, reason, requestId);
  };

  const exploreDoubt = (focus: string) => {
    if (state.phase !== "ending" || state.extensionUsed) return;
    const { requestId } = beginRequest();
    dispatch({ type: "REQUEST_EXTENSION", focus, requestId });
    void loadExtensionRound(focus.trim(), requestId, state.history);
  };

  const recoverRequest = (usePrepared: boolean) => {
    if (state.phase !== "error" || !failedOperation.current) return;
    const operation = failedOperation.current;
    const { requestId, signal } = beginRequest();
    const source = usePrepared ? preparedProvider : provider;
    if (usePrepared) {
      setNotice({ code: "prepared-recovery", message: "Continuing with prepared reflection." });
    } else {
      setNotice(null);
    }
    dispatch({ type: "RECOVER_REQUEST", requestId });
    if (operation.kind === "round") {
      void requestRound(operation, source, requestId, signal);
    } else {
      void requestSummary(operation, source, requestId, signal);
    }
  };

  const restart = () => {
    abortController.current?.abort();
    requestCounter.current += 1;
    selectionLocked.current = false;
    failedOperation.current = null;
    setNotice(null);
    dispatch({ type: "RESTART", requestId: requestCounter.current });
  };

  return (
    <AppShell
      state={state}
      notice={notice}
      onOpenEntry={() => dispatch({ type: "OPEN_ENTRY" })}
      onCancelEntry={() => dispatch({ type: "CANCEL_ENTRY" })}
      onSubmitDilemma={submitDilemma}
      onOpenLens={(lensIndex) => dispatch({ type: "OPEN_LENS", lensIndex })}
      onReturnToLenses={() => dispatch({ type: "RETURN_TO_LENSES" })}
          onSelectAnswer={(text) => {
        const answers = state.selectedLensIndex === null ? [] : state.currentDiscovery?.lenses[state.selectedLensIndex].answers ?? [];
        const index = answers.indexOf(text);
        const choiceIndex = (index >= 0 ? index : 0) as 0 | 1 | 2;
        void selectAnswer({ text, source: "suggested", choiceIndex });
          }}
          onReviseHistorySelection={(stepIndex, choiceIndex) => void reviseHistorySelection(stepIndex, choiceIndex)}
      onSelectCustomAnswer={(text) => void selectAnswer({ text, source: "custom", choiceIndex: 1 })}
      onOpenCustomAnswer={() => dispatch({ type: "OPEN_CUSTOM_ANSWER" })}
      onCloseCustomAnswer={() => dispatch({ type: "CLOSE_CUSTOM_ANSWER" })}
      onCommitSelection={commitSelection}
      onTransitionComplete={() => dispatch({ type: "TRANSITION_COMPLETE" })}
      onFinish={finish}
      onContinueFromFinish={() => dispatch({ type: "CONTINUE_FROM_FINISH" })}
      onExploreDoubt={exploreDoubt}
      onRetry={() => recoverRequest(false)}
      onUsePrepared={() => recoverRequest(true)}
      onRestart={restart}
      onDismissSummary={() => dispatch({ type: "DISMISS_SUMMARY" })}
    />
  );
}
