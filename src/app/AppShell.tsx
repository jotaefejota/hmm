import type { SessionState } from "../session/session-types";
import type { ContentNotice } from "../services/reflection-provider";
import { WelcomeSeed } from "../components/session/WelcomeSeed";
import { GenerationStatus } from "../components/session/GenerationStatus";
import { ThoughtCanvas } from "../components/canvas/ThoughtCanvas";
import { EndingExperience } from "../components/ending/EndingExperience";
import { RecoveryNotice } from "../components/session/RecoveryNotice";

type AppShellProps = {
  state: SessionState;
  notice: ContentNotice | null;
  onOpenEntry: () => void;
  onCancelEntry: () => void;
  onSubmitDilemma: (dilemma: string) => Promise<void>;
  onOpenLens: (lensIndex: 0 | 1) => void;
  onReturnToLenses: () => void;
  onSelectAnswer: (answer: string) => void;
  onSelectCustomAnswer: (answer: string) => void;
  onOpenCustomAnswer: () => void;
  onCloseCustomAnswer: () => void;
  onCommitSelection: () => void;
  onTransitionComplete: () => void;
  onFinish: (reason: "user" | "suggested") => void;
  onContinueFromFinish: () => void;
  onExploreDoubt: (focus: string) => void;
  onRetry: () => void;
  onUsePrepared: () => void;
  onRestart: () => void;
  onDismissSummary: () => void;
};

export function AppShell(props: AppShellProps) {
  const { state } = props;
  const isWelcome = state.phase === "welcome" || state.phase === "entering";
  const isExploring = [
    "round-ready",
    "lens-ready",
    "writing-custom-answer",
    "answer-selected",
    "transitioning",
    "finish-offered",
    ...(state.phase === "error" && state.errorPhase !== "generating-summary" ? ["error"] : []),
  ].includes(state.phase);
  const isEnding = state.phase === "generating-summary" || state.phase === "ending" ||
    (state.phase === "error" && state.errorPhase === "generating-summary");

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="/" aria-label="Hmm home">
          Hmm<span aria-hidden="true">…</span>
        </a>
      </header>

      {props.notice ? <RecoveryNotice message={props.notice.message} /> : null}
      {isWelcome ? (
        <WelcomeSeed
          phase={state.phase}
          onOpen={props.onOpenEntry}
          onCancel={props.onCancelEntry}
          onSubmit={props.onSubmitDilemma}
        />
      ) : null}

      {state.phase === "generating-round" ? <GenerationStatus dilemma={state.dilemma} /> : null}

      {isExploring ? (
        <ThoughtCanvas
          state={state}
          onSelectAnswer={props.onSelectAnswer}
          onOpenLens={props.onOpenLens}
          onReturnToLenses={props.onReturnToLenses}
          onSelectCustomAnswer={props.onSelectCustomAnswer}
          onOpenCustomAnswer={props.onOpenCustomAnswer}
          onCloseCustomAnswer={props.onCloseCustomAnswer}
          onCommitSelection={props.onCommitSelection}
          onTransitionComplete={props.onTransitionComplete}
          onFinish={props.onFinish}
          onContinueFromFinish={props.onContinueFromFinish}
          onRetry={props.onRetry}
          onUsePrepared={props.onUsePrepared}
          onRestart={props.onRestart}
        />
      ) : null}

      {isEnding ? (
        <EndingExperience
          state={state}
          onRestart={props.onRestart}
          onExploreDoubt={props.onExploreDoubt}
          onRetry={props.onRetry}
          onUsePrepared={props.onUsePrepared}
          onDismiss={props.onDismissSummary}
        />
      ) : null}
    </main>
  );
}
