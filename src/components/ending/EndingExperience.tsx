import type { SessionState } from "../../session/session-types";
import { selectProgress } from "../../session/session-selectors";
import { ProgressCard } from "../session/ProgressCard";
import { TrailView } from "../session/TrailView";
import { ResultLens } from "./ResultLens";
import { MembraneBackground } from "../canvas/MembraneBackground";

export function EndingExperience({ state, onRestart }: { state: SessionState; onRestart: () => void }) {
  return (
    <section className="ending-stage" aria-live="polite" aria-busy={state.phase === "generating-summary"}>
      <MembraneBackground />
      <ProgressCard progress={selectProgress(state)} />
      <TrailView dilemma={state.dilemma} history={state.history} ending />
      {state.phase === "generating-summary" ? (
        <div className="gathering-lens">
          <span aria-hidden="true">✦</span>
          <p>Let me gather the thread…</p>
        </div>
      ) : state.summary ? (
        <ResultLens summary={state.summary} onRestart={onRestart} />
      ) : null}
    </section>
  );
}

