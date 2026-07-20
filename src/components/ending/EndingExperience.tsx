import type { SessionState } from "../../session/session-types";
import { selectCanExtend, selectProgress } from "../../session/session-selectors";
import { useTrailReviewFocus } from "../../session/useTrailReviewFocus";
import { projectCanvas } from "../../layout/projectCanvas";
import { ProgressCard } from "../session/ProgressCard";
import { CellField } from "../canvas/CellField";
import { ResultLens } from "./ResultLens";
import { RequestErrorPanel } from "../session/RequestErrorPanel";
import { TrailReviewCard } from "../session/TrailReviewCard";

type EndingExperienceProps = {
  state: SessionState;
  onRestart: () => void;
  onExploreDoubt: (focus: string) => void;
  onRetry: () => void;
  onUsePrepared: () => void;
  onDismiss: () => void;
};

export function EndingExperience({ state, onRestart, onExploreDoubt, onRetry, onUsePrepared, onDismiss }: EndingExperienceProps) {
  const { review, reviewCellId, isReviewing, focusHistoryAnswer, focusHistoryNode, clearReviewFocus } = useTrailReviewFocus(state);
  const projection = projectCanvas({
    dilemma: state.dilemma,
    history: state.history,
    currentDiscovery: null,
    selectedLensIndex: null,
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
        onReviewNode={focusHistoryNode}
      />
      {review ? <TrailReviewCard step={state.history[review.stepIndex]} onClose={clearReviewFocus} /> : null}
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
          canContinue={Boolean(state.currentDiscovery)}
          onExploreDoubt={onExploreDoubt}
          onDismiss={onDismiss}
          onRestart={onRestart}
        />
      ) : null}
    </section>
  );
}
