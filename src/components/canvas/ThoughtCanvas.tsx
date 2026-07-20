import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { SessionState } from "../../session/session-types";
import { selectCanFinish, selectProgress } from "../../session/session-selectors";
import { useTrailReviewFocus } from "../../session/useTrailReviewFocus";
import { projectCanvas } from "../../layout/projectCanvas";
import { CellField } from "./CellField";
import { ProgressCard } from "../session/ProgressCard";
import { CustomAnswerComposer } from "../session/CustomAnswerComposer";
import { ClarityPrompt } from "../session/ClarityPrompt";

type ThoughtCanvasProps = {
  state: SessionState;
  onSelectAnswer: (answer: string) => void;
  onSelectCustomAnswer: (answer: string) => void;
  onOpenCustomAnswer: () => void;
  onCloseCustomAnswer: () => void;
  onCommitSelection: () => void;
  onTransitionComplete: () => void;
  onContinueAfterClarity: () => void;
  onFinish: (reason: "user" | "suggested") => void;
};

function TransitionMoment({ state, onComplete }: { state: SessionState; onComplete: () => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="transition-moment" aria-live="polite">
      <motion.div
        key={state.activeRequestId}
        className="transition-cell"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
        animate={{ opacity: [0, 1, 1], scale: [0.92, 1.03, 1], filter: "blur(0px)" }}
        transition={{ duration: reducedMotion ? 0.12 : 0.72, times: [0, 0.62, 1] }}
        onAnimationComplete={onComplete}
      >
        <span aria-hidden="true">✦</span>
        <p>{state.pendingRound?.transition ?? "Following that thread…"}</p>
      </motion.div>
    </div>
  );
}

export function ThoughtCanvas(props: ThoughtCanvasProps) {
  const { state } = props;
  const questionRef = useRef<HTMLHeadingElement>(null);
  const progress = selectProgress(state);
  const { reviewCellId, isReviewing, focusHistoryAnswer, clearReviewFocus } = useTrailReviewFocus(state);
  const projection = projectCanvas({
    dilemma: state.dilemma,
    history: state.history,
    currentRound: state.currentRound,
    phase: state.phase,
    selectedAnswer: state.selectedAnswer,
    focusOverrideCellId: reviewCellId,
  });

  useEffect(() => {
    if (state.phase === "round-ready" && !isReviewing) questionRef.current?.focus();
  }, [state.phase, state.currentRound?.question, isReviewing]);

  const fieldPhase = state.phase === "round-ready" || state.phase === "writing-custom-answer" || state.phase === "answer-selected"
    ? state.phase
    : state.phase === "transitioning" || state.phase === "clarity-offered"
      ? state.phase
      : "round-ready";

  return (
    <section
      className={`reflection-stage ${state.phase === "transitioning" ? "transition-stage" : ""} ${state.phase === "clarity-offered" ? "clarity-stage" : ""}`}
      aria-labelledby={state.phase === "round-ready" ? "active-question" : undefined}
      aria-label={state.phase === "transitioning" ? "Following the selected path" : undefined}
    >
      <ProgressCard
        progress={progress}
        onFocusAnswer={focusHistoryAnswer}
        onReturnToNow={clearReviewFocus}
        reviewing={isReviewing}
      />
      <p className="stage-kicker">Follow what has weight. There is no right branch.</p>
      <CellField
        projection={projection}
        phase={fieldPhase}
        questionRef={questionRef}
        onSelect={(answer) => {
          clearReviewFocus();
          props.onSelectAnswer(answer);
        }}
        onCommit={props.onCommitSelection}
        reviewCellId={reviewCellId}
      />

      {state.phase === "round-ready" || state.phase === "writing-custom-answer" ? (
        <button className="custom-answer-hint" type="button" onClick={props.onOpenCustomAnswer}>None quite fit</button>
      ) : null}
      {state.phase === "writing-custom-answer" ? (
        <CustomAnswerComposer onSubmit={props.onSelectCustomAnswer} onCancel={props.onCloseCustomAnswer} />
      ) : null}
      {state.phase === "transitioning" ? (
        <TransitionMoment state={state} onComplete={props.onTransitionComplete} />
      ) : null}
      {state.phase === "clarity-offered" ? (
        <ClarityPrompt onFinish={() => props.onFinish("suggested")} onContinue={props.onContinueAfterClarity} />
      ) : null}
      {selectCanFinish(state) ? (
        <button className="finish-action" type="button" onClick={() => props.onFinish("user")}>
          I think I’ve got it
        </button>
      ) : null}
    </section>
  );
}
