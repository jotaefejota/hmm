import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CanvasOccupancy, CanvasProjection } from "../../layout/projectCanvas";
import { CELL_SIZE_RATIO, FIELD_HEIGHT, FIELD_WIDTH, getCellSlot } from "../../layout/cell-field";
import { ConnectionLayer } from "./ConnectionLayer";

type CellFieldProps = {
  projection: CanvasProjection;
  phase: "round-ready" | "writing-custom-answer" | "answer-selected" | "transitioning" | "clarity-offered" | "generating-summary" | "ending";
  questionRef?: React.RefObject<HTMLHeadingElement | null>;
  onSelect?: (answer: string) => void;
  onCommit?: () => void;
  ending?: boolean;
};

function CellContent({
  item,
  phase,
  questionRef,
  onSelect,
  onCommit,
}: {
  item: CanvasOccupancy;
  phase: CellFieldProps["phase"];
  questionRef?: CellFieldProps["questionRef"];
  onSelect?: (answer: string) => void;
  onCommit?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const isActiveQuestion = item.kind === "question" && item.status === "active";
  const isSelected = item.status === "selected";
  const targetOpacity = item.status === "clearing" ? 0 : item.age > 0 ? Math.max(0.6, 1 - item.age * 0.055) : 1;
  const className = `cell-content content-${item.kind} status-${item.status}`;
  const transition = { duration: reducedMotion ? 0.12 : isSelected ? 0.48 : 0.34, ease: [0.22, 1, 0.36, 1] as const };
  const body = (
    <>
      {isActiveQuestion ? <span className="question-pin" aria-hidden="true">?</span> : null}
      <span className="node-label">{item.label}</span>
      {isSelected ? <span className="selection-check" aria-hidden="true">✓</span> : null}
      {isActiveQuestion ? (
        <h1 id="active-question" ref={questionRef} tabIndex={-1}>{item.text}</h1>
      ) : (
        <span className="node-copy">{item.text}</span>
      )}
    </>
  );

  if (item.kind === "suggestion") {
    return (
      <motion.button
        key={item.semanticId}
        className={className}
        type="button"
        aria-label={`${item.label}: ${item.text}`}
        disabled={!item.interactive}
        onClick={() => { if (item.interactive) onSelect?.(item.text); }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: targetOpacity, scale: isSelected ? 1.08 : item.status === "clearing" ? 0.9 : 1 }}
        exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
        transition={transition}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <motion.article
      key={item.semanticId}
      data-history-node={item.status !== "active" ? item.semanticId : undefined}
      className={className}
      initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.92 }}
      animate={{ opacity: targetOpacity, scale: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
      transition={transition}
      onAnimationComplete={() => {
        if (phase === "answer-selected" && isSelected) onCommit?.();
      }}
    >
      {body}
    </motion.article>
  );
}

export function CellField({ projection, phase, questionRef, onSelect, onCommit, ending = false }: CellFieldProps) {
  const focus = getCellSlot(projection.focusCellId);

  useEffect(() => {
    if (phase !== "answer-selected" || !onCommit) return;
    const safetyCommit = window.setTimeout(onCommit, 900);
    return () => window.clearTimeout(safetyCommit);
  }, [onCommit, phase]);

  return (
    <div
      className={`cell-field ${ending ? "is-ending" : ""}`}
      style={{
        "--field-width": `${FIELD_WIDTH}vw`,
        "--field-height": `${FIELD_HEIGHT}vw`,
        "--cell-size-ratio": String(CELL_SIZE_RATIO),
        "--field-shift-x": `calc(54vw - ${focus.x}vw)`,
        "--field-shift-y": `calc(50vh - ${focus.y}vw)`,
      } as React.CSSProperties}
      data-cell-count={projection.cells.length}
    >
      <ConnectionLayer edges={projection.edges} />
      {projection.cells.map((slot) => {
        const item = projection.occupancy.find((candidate) => candidate.cellId === slot.id);
        const cellClass = item
          ? `is-occupied is-${item.kind} is-${item.status}`
          : "is-empty";
        return (
          <div
            key={slot.id}
            data-cell-slot={slot.id}
            className={`field-cell field-cell-${slot.size} field-role-${slot.role} shape-${slot.shape} ${cellClass}`}
            style={{
              "--cell-x": `${(slot.x / FIELD_WIDTH) * 100}%`,
              "--cell-y": `${(slot.y / FIELD_HEIGHT) * 100}%`,
            } as React.CSSProperties}
          >
            <AnimatePresence mode="wait" initial={false}>
              {item ? (
                <CellContent
                  item={item}
                  phase={phase}
                  questionRef={questionRef}
                  onSelect={onSelect}
                  onCommit={onCommit}
                />
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
