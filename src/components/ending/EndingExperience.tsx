import type { SessionState } from "../../session/session-types";
import { selectCanExtend, selectProgress } from "../../session/session-selectors";
import { projectCanvas } from "../../layout/projectCanvas";
import { ProgressCard } from "../session/ProgressCard";
import { CellField } from "../canvas/CellField";
import { ResultLens } from "./ResultLens";

type EndingExperienceProps = {
  state: SessionState;
  onRestart: () => void;
  onExploreDoubt: (focus: string) => void;
};

export function EndingExperience({ state, onRestart, onExploreDoubt }: EndingExperienceProps) {
  const projection = projectCanvas({
    dilemma: state.dilemma,
    history: state.history,
    currentRound: null,
    phase: state.phase,
    selectedAnswer: null,
  });
  const canExtend = selectCanExtend(state);

  return (
    <section className="ending-stage" aria-live="polite" aria-busy={state.phase === "generating-summary"}>
      <ProgressCard progress={selectProgress(state)} openByDefault={state.phase === "ending"} />
      <CellField projection={projection} phase={state.phase === "ending" ? "ending" : "generating-summary"} ending />
      {state.phase === "generating-summary" ? (
        <div className="gathering-lens">
          <span aria-hidden="true">✦</span>
          <p>Let me gather the thread…</p>
        </div>
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
