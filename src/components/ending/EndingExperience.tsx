import type { SessionState } from "../../session/session-types";
import { selectCanExtend, selectProgress } from "../../session/session-selectors";
import { useTrailReviewFocus } from "../../session/useTrailReviewFocus";
import { projectCanvas } from "../../layout/projectCanvas";
import { ProgressCard } from "../session/ProgressCard";
import { CellField } from "../canvas/CellField";
import { ResultLens } from "./ResultLens";
import { RequestErrorPanel } from "../session/RequestErrorPanel";

type EndingExperienceProps = {
  state: SessionState;
  onRestart: () => void;
  onExploreDoubt: (focus: string) => void;
  onRetry: () => void;
  onUsePrepared: () => void;
};

export function EndingExperience({ state, onRestart, onExploreDoubt, onRetry, onUsePrepared }: EndingExperienceProps) {
  const { reviewCellId, isReviewing, focusHistoryAnswer, clearReviewFocus } = useTrailReviewFocus(state);
  const projection = projectCanvas({
    dilemma: state.dilemma,
    history: state.history,
    currentRound: null,
    phase: state.phase,
    selectedAnswer: null,
    focusOverrideCellId: reviewCellId,
  });
  const canExtend = selectCanExtend(state);

  return (
    <section className="ending-stage" aria-live="polite" aria-busy={state.phase === "generating-summary"}>
      <ProgressCard
        progress={selectProgress(state)}
        openByDefault={state.phase === "ending"}
        onFocusAnswer={focusHistoryAnswer}
        onReturnToNow={clearReviewFocus}
        reviewing={isReviewing}
      />
      <CellField
        projection={projection}
        phase={state.phase === "ending" ? "ending" : "generating-summary"}
        ending
        reviewCellId={reviewCellId}
      />
      {state.phase === "generating-summary" ? (
        <div className="gathering-lens">
          <span aria-hidden="true">✦</span>
          <p>Let me gather the thread…</p>
        </div>
      ) : state.phase === "error" && state.requestError ? (
        <RequestErrorPanel
          error={state.requestError}
          onRetry={onRetry}
          onUsePrepared={onUsePrepared}
          onRestart={onRestart}
        />
      ) : state.summary ? (
        <ResultLens
          summary={state.summary}
          dilemma={state.dilemma}
          history={state.history}
          canExtend={canExtend}
          onExploreDoubt={onExploreDoubt}
          onRestart={onRestart}
        />
      ) : null}
    </section>
  );
}
