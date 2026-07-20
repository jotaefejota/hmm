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
  onSelectAnswer: (answer: string) => void;
  onSelectCustomAnswer: (answer: string) => void;
  onOpenCustomAnswer: () => void;
  onCloseCustomAnswer: () => void;
  onCommitSelection: () => void;
  onTransitionComplete: () => void;
  onContinueAfterClarity: () => void;
  onFinish: (reason: "user" | "suggested") => void;
  onExploreDoubt: (focus: string) => void;
  onRestart: () => void;
};

export function AppShell(props: AppShellProps) {
  const { state } = props;
  const isWelcome = state.phase === "welcome" || state.phase === "entering";
  const isExploring = [
    "round-ready",
    "writing-custom-answer",
    "answer-selected",
    "transitioning",
    "clarity-offered",
  ].includes(state.phase);

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="/" aria-label="Hmm home">
          Hmm<span aria-hidden="true">…</span>
        </a>
        <span className="mode-chip">Demo path</span>
      </header>

      {props.notice ? <RecoveryNotice message={props.notice.message} /> : null}
      {state.phase === "error" && state.requestError ? (
        <div className="boundary-notice" role="alert">
          <p>{state.requestError.message}</p>
          <button className="primary-action" type="button" onClick={props.onRestart}>
            Start over
          </button>
        </div>
      ) : null}

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
          onSelectCustomAnswer={props.onSelectCustomAnswer}
          onOpenCustomAnswer={props.onOpenCustomAnswer}
          onCloseCustomAnswer={props.onCloseCustomAnswer}
          onCommitSelection={props.onCommitSelection}
          onTransitionComplete={props.onTransitionComplete}
          onContinueAfterClarity={props.onContinueAfterClarity}
          onFinish={props.onFinish}
        />
      ) : null}

      {state.phase === "generating-summary" || state.phase === "ending" ? (
        <EndingExperience
          state={state}
          onRestart={props.onRestart}
          onExploreDoubt={props.onExploreDoubt}
        />
      ) : null}
    </main>
  );
}
