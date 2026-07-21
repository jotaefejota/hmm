import type { SessionState } from "../session/session-types";
import type { ContentNotice } from "../services/reflection-provider";
import { WelcomeSeed } from "../components/session/WelcomeSeed";
import { ThoughtCanvas } from "../components/canvas/ThoughtCanvas";
import { EndingExperience } from "../components/ending/EndingExperience";
import { RecoveryNotice } from "../components/session/RecoveryNotice";

type AppShellProps = {
  state: SessionState;
  notice: ContentNotice | null;
  onSubmitDilemma: (dilemma: string) => Promise<void>;
  onOpenLens: (lensIndex: 0 | 1) => void;
  onOpenFortune: (round: number, text: string) => void;
  onReturnToLenses: () => void;
  onSelectAnswer: (answer: string) => void;
  onReviseHistorySelection: (stepIndex: number, choiceIndex: 0 | 1 | 2) => void;
  onSelectCustomAnswer: (answer: string) => void;
  onOpenCustomAnswer: () => void;
  onCloseCustomAnswer: () => void;
  onCommitSelection: () => void;
  onTransitionComplete: () => void;
  onFinish: (reason: "user" | "suggested") => void;
  onContinueFromFinish: () => void;
  onExploreDoubt: () => void;
  onRetry: () => void;
  onRestart: () => void;
  onReturnToLanding: () => void;
  onDismissSummary: () => void;
};

export function AppShell(props: AppShellProps) {
  const { state } = props;
  const isWelcome = state.phase === "entering";
  const isExploring = [
    "generating-round",
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
      {props.notice ? <RecoveryNotice message={props.notice.message} /> : null}
      {isWelcome ? (
        <WelcomeSeed
          phase={state.phase}
          onSubmit={props.onSubmitDilemma}
          initialDilemma={state.dilemma}
        />
      ) : null}

      {isExploring ? (
        <ThoughtCanvas
          state={state}
          onSelectAnswer={props.onSelectAnswer}
          onReviseHistorySelection={props.onReviseHistorySelection}
          onOpenLens={props.onOpenLens}
          onOpenFortune={props.onOpenFortune}
          onReturnToLenses={props.onReturnToLenses}
          onSelectCustomAnswer={props.onSelectCustomAnswer}
          onOpenCustomAnswer={props.onOpenCustomAnswer}
          onCloseCustomAnswer={props.onCloseCustomAnswer}
          onCommitSelection={props.onCommitSelection}
          onTransitionComplete={props.onTransitionComplete}
          onFinish={props.onFinish}
          onContinueFromFinish={props.onContinueFromFinish}
          onRetry={props.onRetry}
          onRestart={props.onRestart}
          onReturnToLanding={props.onReturnToLanding}
        />
      ) : null}

      {isEnding ? (
        <EndingExperience
          state={state}
          onRestart={props.onRestart}
          onExploreDoubt={props.onExploreDoubt}
          onRetry={props.onRetry}
          onDismiss={props.onDismissSummary}
          onReturnToLanding={props.onReturnToLanding}
        />
      ) : null}
    </main>
  );
}
