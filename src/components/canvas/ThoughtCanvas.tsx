import { useEffect, useRef, useState } from "react";
import type { SessionState } from "../../session/session-types";
import { selectCanFinish, selectProgress } from "../../session/session-selectors";
import { useTrailReviewFocus } from "../../session/useTrailReviewFocus";
import { projectCanvas } from "../../layout/projectCanvas";
import { getHistoryAnswerCellId } from "../../layout/cell-field";
import { CellField } from "./CellField";
import { ProgressCard } from "../session/ProgressCard";
import { CustomAnswerComposer } from "../session/CustomAnswerComposer";
import { RequestErrorPanel } from "../session/RequestErrorPanel";
import { TrailReviewCard } from "../session/TrailReviewCard";

type ThoughtCanvasProps = {
  state: SessionState;
  onSelectAnswer: (answer: string) => void;
  onReviseHistorySelection: (stepIndex: number, choiceIndex: 0 | 1 | 2) => void;
  onOpenLens: (lensIndex: 0 | 1) => void;
  onOpenFortune: (round: number, text: string) => void;
  onReturnToLenses: () => void;
  onSelectCustomAnswer: (answer: string) => void;
  onOpenCustomAnswer: () => void;
  onCloseCustomAnswer: () => void;
  onCommitSelection: () => void;
  onTransitionComplete: () => void;
  onFinish: (reason: "user" | "suggested") => void;
  onContinueFromFinish: () => void;
  onRetry: () => void;
  onRestart: () => void;
  onReturnToLanding: () => void;
};

export function ThoughtCanvas(props: ThoughtCanvasProps) {
  const { state } = props;
  const questionRef = useRef<HTMLHeadingElement>(null);
  const progress = selectProgress(state);
  const { review, reviewCellId, isReviewing, focusHistoryAnswer, focusHistoryNode, clearReviewFocus } = useTrailReviewFocus(state);
  const [expandedDecision, setExpandedDecision] = useState<{ historyLength: number; stepIndex: number } | null>(null);
  const [decisionFocus, setDecisionFocus] = useState<{ historyLength: number; stepIndex: number } | null>(null);
  const expandedDecisionStepIndex = expandedDecision?.historyLength === state.history.length
    ? expandedDecision.stepIndex
    : null;
  const suppressCurrentDiscovery = expandedDecisionStepIndex !== null && (
    state.phase === "lens-ready" || state.phase === "round-ready" || state.phase === "writing-custom-answer"
  );
  const focusedDecisionStepIndex = decisionFocus?.historyLength === state.history.length
    ? decisionFocus.stepIndex
    : null;
  const focusedDecisionCellId = focusedDecisionStepIndex === null
    ? null
    : getHistoryAnswerCellId(state.history, focusedDecisionStepIndex);
  const canvasFocusCellId = reviewCellId ?? focusedDecisionCellId;
  const projection = projectCanvas({
    dilemma: state.dilemma,
    history: state.history,
    currentDiscovery: state.currentDiscovery,
    selectedLensIndex: state.selectedLensIndex,
    phase: state.phase,
    selectedAnswer: state.selectedAnswer,
    fortuneSeed: state.fortuneSeed,
    focusOverrideCellId: canvasFocusCellId,
    expandedDecisionStepIndex,
    suppressCurrentDiscovery,
  });

  useEffect(() => {
    if (state.phase === "round-ready" && !isReviewing) questionRef.current?.focus();
  }, [state.phase, state.selectedLensIndex, isReviewing]);

  useEffect(() => {
    if (state.phase !== "transitioning") return;
    const timer = window.setTimeout(props.onTransitionComplete, 620);
    return () => window.clearTimeout(timer);
  }, [props.onTransitionComplete, state.activeRequestId, state.phase]);

  const fieldPhase = state.phase === "lens-ready" || state.phase === "round-ready" || state.phase === "writing-custom-answer" || state.phase === "answer-selected"
      ? state.phase
      : state.phase === "generating-round" || state.phase === "transitioning" || state.phase === "finish-offered"
      ? state.phase
      : "round-ready";

  return (
    <section
      className={`reflection-stage ${(state.phase === "generating-round" || state.phase === "transitioning") ? "transition-stage" : ""} ${state.phase === "generating-round" && state.history.length === 0 ? "initial-grid-enter" : ""} ${state.phase === "finish-offered" ? "finish-stage" : ""}`}
      aria-labelledby={state.phase === "round-ready" ? "active-question" : undefined}
      aria-label={state.phase === "generating-round" ? "Preparing the first paths" : state.phase === "transitioning" ? "Following the selected path" : undefined}
    >
      <div className="progress-stack">
        <ProgressCard
          progress={progress}
          onFocusAnswer={focusHistoryAnswer}
          onReturnToNow={clearReviewFocus}
          reviewing={isReviewing}
          onReturnToLanding={props.onReturnToLanding}
        />
        {review ? <TrailReviewCard step={state.history[review.stepIndex]} onClose={clearReviewFocus} /> : null}
      </div>
      <CellField
        projection={projection}
        phase={fieldPhase}
        questionRef={questionRef}
        onSelect={(answer) => {
          clearReviewFocus();
          setExpandedDecision(null);
          setDecisionFocus(null);
          props.onSelectAnswer(answer);
        }}
        onReviseSelection={(stepIndex, choiceIndex) => {
          clearReviewFocus();
          setExpandedDecision(null);
          setDecisionFocus(null);
          props.onReviseHistorySelection(stepIndex, choiceIndex);
        }}
        onOpenLens={(lensIndex) => {
          clearReviewFocus();
          setDecisionFocus(null);
          props.onOpenLens(lensIndex);
        }}
        onOpenFortune={props.onOpenFortune}
        onOpenCustomAnswer={props.onOpenCustomAnswer}
        onExitExpandedDecision={() => {
          clearReviewFocus();
          setExpandedDecision(null);
          setDecisionFocus(null);
          props.onReturnToLenses();
        }}
        onReturnToLenses={props.onReturnToLenses}
        onReviewNode={(stepIndex, focusKind) => {
          setExpandedDecision({ historyLength: state.history.length, stepIndex });
          focusHistoryNode(stepIndex, focusKind);
        }}
        onToggleDecision={(stepIndex) => {
          clearReviewFocus();
          setDecisionFocus({ historyLength: state.history.length, stepIndex });
          setExpandedDecision((current) => current?.historyLength === state.history.length && current.stepIndex === stepIndex
            ? null
            : { historyLength: state.history.length, stepIndex });
        }}
        expandedDecisionStepIndex={expandedDecisionStepIndex}
        onCommit={props.onCommitSelection}
        onOpenFinish={() => props.onFinish("suggested")}
        onContinueFromFinish={props.onContinueFromFinish}
        reviewCellId={canvasFocusCellId}
      />

      {(state.phase === "round-ready" || state.phase === "writing-custom-answer") && !suppressCurrentDiscovery ? (
        <button className="other-angle-action" type="button" onClick={props.onReturnToLenses}>Try the other angle</button>
      ) : null}

      {state.phase === "writing-custom-answer" ? (
        <CustomAnswerComposer onSubmit={props.onSelectCustomAnswer} onCancel={props.onCloseCustomAnswer} />
      ) : null}
      {state.phase === "error" && state.requestError ? (
        <RequestErrorPanel
          error={state.requestError}
          onRetry={props.onRetry}
          onRestart={props.onRestart}
        />
      ) : null}
      {selectCanFinish(state) && state.phase !== "finish-offered" ? (
        <button className="finish-action" type="button" onClick={() => props.onFinish("user")}>
          I think I’ve got it
        </button>
      ) : null}
    </section>
  );
}
