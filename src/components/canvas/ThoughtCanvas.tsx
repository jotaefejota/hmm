import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { SessionState } from "../../session/session-types";
import { selectCanFinish, selectProgress } from "../../session/session-selectors";
import { projectActiveRound } from "../../layout/projectCanvas";
import { MembraneBackground } from "./MembraneBackground";
import { ConnectionLayer } from "./ConnectionLayer";
import { ThoughtNode } from "./ThoughtNode";
import { AnswerCluster } from "../session/AnswerCluster";
import { ProgressCard } from "../session/ProgressCard";
import { CustomAnswerComposer } from "../session/CustomAnswerComposer";
import { TrailView } from "../session/TrailView";
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
        initial={{ opacity: 0, scale: 0.82, filter: "blur(8px)" }}
        animate={{ opacity: [0, 1, 1], scale: [0.82, 1.04, 1], filter: "blur(0px)" }}
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
  const round = state.currentRound;
  const roundNumber = state.history.length + 1;

  useEffect(() => {
    if (state.phase === "round-ready") questionRef.current?.focus();
  }, [state.phase, round?.question]);

  if (state.phase === "transitioning") {
    return (
      <section className="reflection-stage transition-stage" aria-label="Following the selected path">
        <MembraneBackground />
        <ProgressCard progress={progress} />
        <TrailView dilemma={state.dilemma} history={state.history} />
        <TransitionMoment state={state} onComplete={props.onTransitionComplete} />
      </section>
    );
  }

  if (state.phase === "clarity-offered") {
    return (
      <section className="reflection-stage clarity-stage" aria-labelledby="clarity-heading">
        <MembraneBackground />
        <ProgressCard progress={progress} />
        <TrailView dilemma={state.dilemma} history={state.history} />
        <ClarityPrompt
          onFinish={() => props.onFinish("suggested")}
          onContinue={props.onContinueAfterClarity}
        />
      </section>
    );
  }

  if (!round) return null;
  const projection = projectActiveRound(round, roundNumber, state.history.length > 0);
  const selectedSuggested = state.selectedAnswer?.source === "suggested" ? state.selectedAnswer.text : null;
  const selectedSuggestionId = projection.nodes.suggestions.find((suggestion) => suggestion.text === selectedSuggested)?.id;
  const visibleEdges = state.phase === "answer-selected"
    ? projection.edges.filter((edge) => edge.status === "origin" || edge.to.id === selectedSuggestionId)
    : projection.edges;

  return (
    <section className="reflection-stage" aria-labelledby="active-question">
      <MembraneBackground />
      <ProgressCard progress={progress} />
      {state.history.length ? <TrailView dilemma={state.dilemma} history={state.history} /> : null}
      <p className="stage-kicker">Follow what has weight. There is no right branch.</p>

      <div className="semantic-canvas">
        <ConnectionLayer edges={visibleEdges} />
        {!state.history.length ? (
          <ThoughtNode
            className="dilemma-node"
            label="You brought"
            x={projection.nodes.dilemma.x}
            y={projection.nodes.dilemma.y}
            shape={projection.nodes.dilemma.shape}
          >
            {state.dilemma}
          </ThoughtNode>
        ) : null}
        <motion.div
          key={projection.nodes.question.id}
          className={`thought-node question-node shape-${projection.nodes.question.shape}`}
          style={{ "--node-x": `${projection.nodes.question.x}%`, "--node-y": `${projection.nodes.question.y}%` } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.42 }}
        >
          <span className="question-pin" aria-hidden="true">?</span>
          <span className="node-label">Hmm… asks</span>
          <h1 id="active-question" ref={questionRef} tabIndex={-1}>{round.question}</h1>
        </motion.div>
        <AnswerCluster
          projection={projection}
          phase={state.phase}
          selectedAnswer={state.selectedAnswer}
          onSelect={props.onSelectAnswer}
          onOpenCustom={props.onOpenCustomAnswer}
          onCommit={props.onCommitSelection}
        />
        {state.phase === "writing-custom-answer" ? (
          <CustomAnswerComposer onSubmit={props.onSelectCustomAnswer} onCancel={props.onCloseCustomAnswer} />
        ) : null}
      </div>

      {selectCanFinish(state) ? (
        <button className="finish-action" type="button" onClick={() => props.onFinish("user")}>
          I think I’ve got it
        </button>
      ) : null}
    </section>
  );
}
