import type { SessionState } from "../session/session-types";
import { WelcomeSeed } from "../components/session/WelcomeSeed";
import { GenerationStatus } from "../components/session/GenerationStatus";
import { ThoughtCanvas } from "../components/canvas/ThoughtCanvas";

type AppShellProps = {
  state: SessionState;
  onOpenEntry: () => void;
  onCancelEntry: () => void;
  onSubmitDilemma: (dilemma: string) => Promise<void>;
};

export function AppShell({ state, onOpenEntry, onCancelEntry, onSubmitDilemma }: AppShellProps) {
  const isWelcome = state.phase === "welcome" || state.phase === "entering";

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="/" aria-label="Hmm home">
          Hmm<span aria-hidden="true">…</span>
        </a>
        <span className="mode-chip">Demo path</span>
      </header>

      {isWelcome ? (
        <WelcomeSeed
          phase={state.phase}
          onOpen={onOpenEntry}
          onCancel={onCancelEntry}
          onSubmit={onSubmitDilemma}
        />
      ) : null}

      {state.phase === "generating-round" ? <GenerationStatus dilemma={state.dilemma} /> : null}

      {state.phase === "round-ready" && state.currentRound ? (
        <ThoughtCanvas state={state} round={state.currentRound} />
      ) : null}
    </main>
  );
}

