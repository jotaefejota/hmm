import type { RoundPayload } from "../../../shared/ai-contract";
import type { FirstRoundProjection } from "../../layout/projectCanvas";
import { ThoughtNode } from "../canvas/ThoughtNode";

type AnswerClusterProps = {
  round: RoundPayload;
  projection: FirstRoundProjection;
};

export function AnswerCluster({ round, projection }: AnswerClusterProps) {
  return (
    <div className="answer-cluster" aria-label="Three possible answers">
      {projection.nodes.suggestions.map((suggestion, index) => (
        <ThoughtNode
          key={suggestion.id}
          className="suggestion-node"
          label={`Possibility ${index + 1}`}
          x={suggestion.x}
          y={suggestion.y}
          shape={suggestion.shape}
          interactive
        >
          {round.answers[index]}
        </ThoughtNode>
      ))}
      <span className="custom-answer-hint">None quite fit</span>
    </div>
  );
}
