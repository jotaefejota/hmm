import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ActiveRoundProjection } from "../../layout/projectCanvas";
import type { SessionPhase, SelectedAnswer } from "../../session/session-types";

type AnswerClusterProps = {
  projection: ActiveRoundProjection;
  phase: SessionPhase;
  selectedAnswer: SelectedAnswer | null;
  onSelect: (answer: string) => void;
  onOpenCustom: () => void;
  onCommit: () => void;
};

export function AnswerCluster({
  projection,
  phase,
  selectedAnswer,
  onSelect,
  onOpenCustom,
  onCommit,
}: AnswerClusterProps) {
  const isSelecting = phase === "answer-selected";
  const visibleSuggestions = isSelecting
    ? projection.nodes.suggestions.filter((suggestion) => suggestion.text === selectedAnswer?.text)
    : projection.nodes.suggestions;

  useEffect(() => {
    if (!isSelecting) return;
    const safetyCommit = window.setTimeout(onCommit, 900);
    return () => window.clearTimeout(safetyCommit);
  }, [isSelecting, onCommit, selectedAnswer?.text]);

  return (
    <div className="answer-cluster" aria-label="Three possible answers">
      <AnimatePresence initial={false} onExitComplete={() => { if (isSelecting) onCommit(); }}>
        {visibleSuggestions.map((suggestion, index) => {
          const selected = isSelecting && suggestion.text === selectedAnswer?.text;
          const style = {
            "--node-x": `${suggestion.x}%`,
            "--node-y": `${suggestion.y}%`,
          } as React.CSSProperties;
          return (
            <motion.button
              key={suggestion.id}
              className={`thought-node suggestion-node shape-${suggestion.shape} ${selected ? "is-selected" : ""}`}
              style={style}
              type="button"
              aria-label={`Possibility ${index + 1}: ${suggestion.text}`}
              disabled={isSelecting}
              onClick={() => onSelect(suggestion.text)}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: selected ? 1.09 : 1 }}
              exit={{ opacity: 0, scale: 0.78, filter: "blur(5px)" }}
              transition={{ duration: selected ? 0.48 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="node-label">{selected ? "Your answer" : `Possibility ${index + 1}`}</span>
              {selected ? <span className="selection-check" aria-hidden="true">✓</span> : null}
              <span className="node-copy">{suggestion.text}</span>
            </motion.button>
          );
        })}
        {isSelecting && selectedAnswer?.source === "custom" ? (
          <motion.div
            key="selected-custom"
            className="thought-node suggestion-node is-selected custom-selected shape-3"
            style={{ "--node-x": "82%", "--node-y": "50%" } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1.09 }}
          >
            <span className="node-label">Your answer</span>
            <span className="selection-check" aria-hidden="true">✓</span>
            <span className="node-copy">{selectedAnswer.text}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {!isSelecting ? (
        <button className="custom-answer-hint" type="button" onClick={onOpenCustom}>None quite fit</button>
      ) : null}
    </div>
  );
}
