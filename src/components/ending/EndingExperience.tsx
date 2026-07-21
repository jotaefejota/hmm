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
  onExploreDoubt: () => void;
  onRetry: () => void;
  onDismiss: () => void;
  onReturnToLanding: () => void;
};

export function EndingExperience({ state, onRestart, onExploreDoubt, onRetry, onDismiss, onReturnToLanding }: EndingExperienceProps) {
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
      <div className="progress-stack">
        <ProgressCard
          progress={selectProgress(state)}
          openByDefault={state.phase === "ending"}
          onFocusAnswer={focusHistoryAnswer}
          onReturnToNow={clearReviewFocus}
          reviewing={isReviewing}
          onReturnToLanding={onReturnToLanding}
        />
        {review ? <TrailReviewCard step={state.history[review.stepIndex]} onClose={clearReviewFocus} /> : null}
      </div>
      <CellField
        projection={projection}
        phase={state.phase === "ending" ? "ending" : "generating-summary"}
        ending
        reviewCellId={reviewCellId}
        onReviewNode={focusHistoryNode}
      />
      {state.phase === "error" && state.requestError ? (
        <RequestErrorPanel
          error={state.requestError}
          onRetry={onRetry}
          onRestart={onRestart}
        />
      ) : state.summary ? (
        <ResultLens
          summary={state.summary}
          dilemma={state.dilemma}
          history={state.history}
          fortunes={state.openedFortunes}
          canExtend={canExtend}
          canContinue={Boolean(state.currentDiscovery)}
          onContinueExploring={onExploreDoubt}
          onDismiss={onDismiss}
          onRestart={onRestart}
        />
      ) : null}
    </section>
  );
}
