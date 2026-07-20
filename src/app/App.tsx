import { useEffect, useReducer, useRef } from "react";
import { AppShell } from "./AppShell";
import { reflectionProvider } from "../services/mock-provider";
import { sessionReducer } from "../session/session-reducer";
import { initialSessionState } from "../session/session-types";
import type { FinishReason, ReflectionStep, SelectedAnswer } from "../session/session-types";
import { MAX_CORE_ROUNDS } from "../../shared/limits";
import { roundRequestSchema, summaryRequestSchema } from "../../shared/ai-contract";

const MINIMUM_GENERATION_MS = 420;

const pause = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));
const wasAborted = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
const toContractHistory = (history: ReflectionStep[]) => history.map((step) => ({
  round: step.round,
  question: step.question,
  answer: step.answer,
  answerSource: step.answerSource,
}));

export function App() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const requestCounter = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const selectionLocked = useRef(false);

  useEffect(() => {
    if (state.phase === "round-ready") selectionLocked.current = false;
  }, [state.phase]);

  const beginRequest = () => {
    abortController.current?.abort();
    abortController.current = new AbortController();
    requestCounter.current += 1;
    return { requestId: requestCounter.current, signal: abortController.current.signal };
  };

  const submitDilemma = async (dilemma: string) => {
    if (state.phase !== "entering") return;
    const { requestId, signal } = beginRequest();
    dispatch({ type: "SUBMIT_DILEMMA", dilemma, requestId });
    const request = roundRequestSchema.parse({
      contractVersion: "1",
      kind: "round",
      dilemma: dilemma.trim(),
      roundNumber: 1,
      requestMode: "core",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: [],
      focus: null,
    });

    try {
      const [round] = await Promise.all([
        reflectionProvider.getRound(request, signal),
        pause(MINIMUM_GENERATION_MS),
      ]);
      dispatch({ type: "ROUND_LOADED", round, requestId });
    } catch (error) {
      if (!wasAborted(error)) throw error;
    }
  };

  const selectAnswer = async (answer: SelectedAnswer) => {
    if (
      selectionLocked.current ||
      (state.phase !== "round-ready" && state.phase !== "writing-custom-answer") ||
      !state.currentRound
    ) return;

    selectionLocked.current = true;
    const { requestId, signal } = beginRequest();
    const completedStep: ReflectionStep = {
      round: state.history.length + 1,
      question: state.currentRound.question,
      answer: answer.text,
      answerSource: answer.source,
      choiceIndex: answer.choiceIndex,
    };
    const nextHistory = [...state.history, completedStep];
    dispatch({ type: "SELECT_ANSWER", answer, requestId });

    if (nextHistory.length >= MAX_CORE_ROUNDS) return;

    const request = roundRequestSchema.parse({
      contractVersion: "1",
      kind: "round",
      dilemma: state.dilemma,
      roundNumber: nextHistory.length + 1,
      requestMode: "core",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: toContractHistory(nextHistory),
      focus: null,
    });

    try {
      const round = await reflectionProvider.getRound(request, signal);
      dispatch({ type: "NEXT_ROUND_LOADED", round, requestId });
    } catch (error) {
      if (!wasAborted(error)) throw error;
    }
  };

  const loadSummary = async (
    history: ReflectionStep[],
    reason: FinishReason,
    requestId: number,
  ) => {
    const signal = abortController.current?.signal;
    const request = summaryRequestSchema.parse({
      contractVersion: "1",
      kind: "summary",
      dilemma: state.dilemma,
      history: toContractHistory(history),
      finishReason: reason,
    });

    try {
      const [summary] = await Promise.all([
        reflectionProvider.getSummary(request, signal),
        pause(MINIMUM_GENERATION_MS),
      ]);
      dispatch({ type: "SUMMARY_LOADED", summary, requestId });
    } catch (error) {
      if (!wasAborted(error)) throw error;
    }
  };

  const commitSelection = () => {
    if (state.phase !== "answer-selected" || !state.currentRound || !state.selectedAnswer) return;
    const committedHistory: ReflectionStep[] = [
      ...state.history,
      {
        round: state.history.length + 1,
        question: state.currentRound.question,
        answer: state.selectedAnswer.text,
        answerSource: state.selectedAnswer.source,
        choiceIndex: state.selectedAnswer.choiceIndex,
      },
    ];
    dispatch({ type: "COMMIT_SELECTION" });
    if (committedHistory.length >= MAX_CORE_ROUNDS) {
      void loadSummary(committedHistory, "max_rounds", state.activeRequestId);
    }
  };

  const finish = (reason: "user" | "suggested") => {
    if (state.history.length < 2) return;
    const { requestId } = beginRequest();
    dispatch({ type: "REQUEST_FINISH", reason, requestId });
    void loadSummary(state.history, reason, requestId);
  };

  const restart = () => {
    abortController.current?.abort();
    requestCounter.current += 1;
    selectionLocked.current = false;
    dispatch({ type: "RESTART", requestId: requestCounter.current });
  };

  return (
    <AppShell
      state={state}
      onOpenEntry={() => dispatch({ type: "OPEN_ENTRY" })}
      onCancelEntry={() => dispatch({ type: "CANCEL_ENTRY" })}
      onSubmitDilemma={submitDilemma}
      onSelectAnswer={(text) => {
        const index = state.currentRound?.answers.indexOf(text) ?? 0;
        const choiceIndex = (index >= 0 ? index : 0) as 0 | 1 | 2;
        void selectAnswer({ text, source: "suggested", choiceIndex });
      }}
      onSelectCustomAnswer={(text) => void selectAnswer({ text, source: "custom", choiceIndex: 1 })}
      onOpenCustomAnswer={() => dispatch({ type: "OPEN_CUSTOM_ANSWER" })}
      onCloseCustomAnswer={() => dispatch({ type: "CLOSE_CUSTOM_ANSWER" })}
      onCommitSelection={commitSelection}
      onTransitionComplete={() => dispatch({ type: "TRANSITION_COMPLETE" })}
      onContinueAfterClarity={() => dispatch({ type: "CONTINUE_AFTER_CLARITY" })}
      onFinish={finish}
      onRestart={restart}
    />
  );
}
