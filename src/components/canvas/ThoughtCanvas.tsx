import { useEffect, useRef } from "react";
import type { RoundPayload } from "../../../shared/ai-contract";
import type { SessionState } from "../../session/session-types";
import { selectProgress } from "../../session/session-selectors";
import { projectFirstRound } from "../../layout/projectCanvas";
import { MembraneBackground } from "./MembraneBackground";
import { ConnectionLayer } from "./ConnectionLayer";
import { ThoughtNode } from "./ThoughtNode";
import { AnswerCluster } from "../session/AnswerCluster";
import { ProgressCard } from "../session/ProgressCard";

export function ThoughtCanvas({ state, round }: { state: SessionState; round: RoundPayload }) {
  const questionRef = useRef<HTMLHeadingElement>(null);
  const projection = projectFirstRound(round);
  const progress = selectProgress(state);

  useEffect(() => {
    questionRef.current?.focus();
  }, []);

  return (
    <section className="reflection-stage" aria-labelledby="active-question">
      <MembraneBackground />
      <ProgressCard progress={progress} />
      <p className="stage-kicker">Follow what has weight. There is no right branch.</p>

      <div className="semantic-canvas">
        <ConnectionLayer edges={projection.edges} />
        <ThoughtNode
          className="dilemma-node"
          label="You brought"
          x={projection.nodes.dilemma.x}
          y={projection.nodes.dilemma.y}
          shape={projection.nodes.dilemma.shape}
        >
          {state.dilemma}
        </ThoughtNode>
        <div
          className={`thought-node question-node shape-${projection.nodes.question.shape}`}
          style={{ "--node-x": `${projection.nodes.question.x}%`, "--node-y": `${projection.nodes.question.y}%` } as React.CSSProperties}
        >
          <span className="question-pin" aria-hidden="true">?</span>
          <span className="node-label">Hmm… asks</span>
          <h1 id="active-question" ref={questionRef} tabIndex={-1}>{round.question}</h1>
        </div>
        <AnswerCluster round={round} projection={projection} />
      </div>
    </section>
  );
}
