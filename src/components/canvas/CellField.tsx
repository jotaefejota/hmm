import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CanvasOccupancy, CanvasProjection } from "../../layout/projectCanvas";
import { CELL_SIZE_RATIO, FIELD_HEIGHT, FIELD_WIDTH, getCellSlot } from "../../layout/cell-field";
import { geometryForCell } from "../../layout/cell-geometry";
import { settleLocalPressure } from "../../layout/pressure-layout";
import { ConnectionLayer } from "./ConnectionLayer";

type CellFieldProps = {
  projection: CanvasProjection;
  phase: "lens-ready" | "round-ready" | "writing-custom-answer" | "answer-selected" | "transitioning" | "finish-offered" | "generating-summary" | "ending";
  questionRef?: React.RefObject<HTMLHeadingElement | null>;
  onSelect?: (answer: string) => void;
  onReviseSelection?: (stepIndex: number, choiceIndex: 0 | 1 | 2) => void;
  onOpenLens?: (lensIndex: 0 | 1) => void;
  onReviewNode?: (stepIndex: number, focusKind: "question" | "answer") => void;
  onToggleDecision?: (stepIndex: number) => void;
  expandedDecisionStepIndex?: number | null;
  onCommit?: () => void;
  onOpenFinish?: () => void;
  onContinueFromFinish?: () => void;
  ending?: boolean;
  reviewCellId?: string | null;
};

function CellContent({
  item,
  phase,
  questionRef,
  onSelect,
  onReviseSelection,
  onOpenLens,
  onReviewNode,
  onToggleDecision,
  expandedDecisionStepIndex,
  onCommit,
  onOpenFinish,
  onContinueFromFinish,
}: {
  item: CanvasOccupancy;
  phase: CellFieldProps["phase"];
  questionRef?: CellFieldProps["questionRef"];
  onSelect?: (answer: string) => void;
  onReviseSelection?: (stepIndex: number, choiceIndex: 0 | 1 | 2) => void;
  onOpenLens?: (lensIndex: 0 | 1) => void;
  onReviewNode?: (stepIndex: number, focusKind: "question" | "answer") => void;
  onToggleDecision?: (stepIndex: number) => void;
  expandedDecisionStepIndex?: number | null;
  onCommit?: () => void;
  onOpenFinish?: () => void;
  onContinueFromFinish?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const isActiveQuestion = item.kind === "question" && item.status === "active";
  const isSelected = item.status === "selected";
  const targetOpacity = item.status === "clearing" ? 0 : item.age > 0 ? Math.max(0.6, 1 - item.age * 0.055) : 1;
  const className = `cell-content content-${item.kind} status-${item.status}`;
  const transition = { duration: reducedMotion ? 0.12 : isSelected ? 0.48 : 0.34, ease: [0.22, 1, 0.36, 1] as const };
  const body = (
    <>
      {isActiveQuestion || item.kind === "lens" ? <span className="question-pin" aria-hidden="true">?</span> : null}
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
        onClick={() => {
          if (!item.interactive) return;
          if (item.revisionStepIndex !== undefined && item.optionIndex !== undefined) {
            onReviseSelection?.(item.revisionStepIndex, item.optionIndex);
            return;
          }
          onSelect?.(item.text);
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: targetOpacity, scale: isSelected ? 1.04 : item.status === "clearing" ? 0.94 : 1 }}
        exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
        transition={transition}
      >
        {body}
      </motion.button>
    );
  }

  if (item.kind === "lens") {
    return (
      <motion.button
        key={item.semanticId}
        className={className}
        type="button"
        aria-label={`Explore ${item.text}`}
        onClick={() => { if (item.lensIndex !== undefined) onOpenLens?.(item.lensIndex); }}
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={transition}
      >
        {body}
      </motion.button>
    );
  }

  if (item.kind === "finish") {
    return (
      <motion.button
        key={item.semanticId}
        className={className}
        type="button"
        aria-label="Open reflection lens"
        onClick={onOpenFinish}
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={transition}
      >
        <svg className="finish-membrane" viewBox="0 0 274 200" aria-hidden="true" preserveAspectRatio="none">
          <path d="M50 50C72 6 115 1 137 22C160 1 204 6 224 50C268 69 269 130 224 150C204 194 160 199 137 178C115 199 72 194 50 150C6 130 6 69 50 50Z" />
        </svg>
        <span className="finish-mark" aria-hidden="true">✦</span>
        {body}
      </motion.button>
    );
  }

  if (item.kind === "continue") {
    return (
      <motion.button
        key={item.semanticId}
        className={className}
        type="button"
        aria-label="Keep exploring with new questions"
        onClick={onContinueFromFinish}
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={transition}
      >
        <span className="continue-mark" aria-hidden="true">→</span>
        <span>{item.text}</span>
      </motion.button>
    );
  }

  if (item.kind === "decision" && item.stepIndex !== undefined) {
    return (
      <motion.button
        key={item.semanticId}
        data-history-node={item.semanticId}
        className={`${className} settled-decision-action`}
        type="button"
        aria-label={`Unfold decision from round ${item.stepIndex + 1}: ${item.text}`}
        onClick={() => onToggleDecision?.(item.stepIndex!)}
        initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
        animate={{ opacity: targetOpacity, y: 0 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
        transition={{ duration: reducedMotion ? 0.12 : 0.28, delay: reducedMotion ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
      >
        {body}
      </motion.button>
    );
  }

  if (item.interactive && item.stepIndex !== undefined && item.reviewKind) {
    const isExpandedDecisionMember = expandedDecisionStepIndex === item.stepIndex;
    return (
      <motion.button
        key={item.semanticId}
        data-history-node={item.semanticId}
        className={`${className} history-cell-action`}
        type="button"
        aria-label={isExpandedDecisionMember
          ? `Settle decision from round ${item.stepIndex + 1}: ${item.text}`
          : `Review round ${item.stepIndex + 1}: ${item.text}`}
        onClick={() => isExpandedDecisionMember
          ? onToggleDecision?.(item.stepIndex!)
          : onReviewNode?.(item.stepIndex!, item.reviewKind!)}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: targetOpacity, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
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

export function CellField({
  projection,
  phase,
  questionRef,
  onSelect,
  onReviseSelection,
  onOpenLens,
  onReviewNode,
  onToggleDecision,
  expandedDecisionStepIndex = null,
  onCommit,
  onOpenFinish,
  onContinueFromFinish,
  ending = false,
  reviewCellId = null,
}: CellFieldProps) {
  const pressurePositions = useMemo(() => settleLocalPressure(projection), [projection]);
  const focusedSlot = getCellSlot(projection.focusCellId);
  const visibleLensSlots = phase === "lens-ready"
    ? projection.occupancy.filter((item) => item.kind === "lens").map((item) => getCellSlot(item.cellId))
    : [];
  const focusedPosition = pressurePositions.get(focusedSlot.id) ?? focusedSlot;
  const focus = visibleLensSlots.length === 2
    ? (() => {
      const first = pressurePositions.get(visibleLensSlots[0].id) ?? visibleLensSlots[0];
      const second = pressurePositions.get(visibleLensSlots[1].id) ?? visibleLensSlots[1];
      return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    })()
    : focusedPosition;
  const [openedCookies, setOpenedCookies] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (phase !== "answer-selected" || !onCommit) return;
    const safetyCommit = window.setTimeout(onCommit, 900);
    return () => window.clearTimeout(safetyCommit);
  }, [onCommit, phase]);

  useEffect(() => {
    if (!reviewCellId || typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 900px)").matches) return;
    const node = document.querySelector(`[data-cell-slot="${reviewCellId}"]`);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [reviewCellId]);

  return (
    <div
      className={`cell-field ${ending ? "is-ending" : ""} ${reviewCellId ? "is-reviewing" : ""}`}
      style={{
        "--field-width": `${FIELD_WIDTH}vw`,
        "--field-height": `${FIELD_HEIGHT}vw`,
        "--cell-size-ratio": String(CELL_SIZE_RATIO),
        "--field-shift-x": `calc(54vw - ${focus.x}vw)`,
        "--field-shift-y": `calc(50vh - ${focus.y}vw)`,
      } as React.CSSProperties}
      data-cell-count={projection.cells.length}
    >
      <ConnectionLayer edges={projection.edges} positions={pressurePositions} />
      {projection.cells.map((slot) => {
        const item = projection.occupancy.find((candidate) => candidate.cellId === slot.id);
        const geometry = geometryForCell(slot, item);
        const position = pressurePositions.get(slot.id) ?? slot;
        const isReviewTarget = reviewCellId === slot.id;
        const cellClass = item
          ? `is-occupied is-${item.kind} is-${item.status}${isReviewTarget ? " is-review-focus" : ""}`
          : "is-empty";
        return (
          <div
            key={slot.id}
            data-cell-slot={slot.id}
            className={`field-cell field-cell-${slot.size} field-footprint-${geometry.footprint} field-role-${slot.role} shape-${slot.shape} ${cellClass}`}
            style={{
              "--cell-x": `${(position.x / FIELD_WIDTH) * 100}%`,
              "--cell-y": `${(position.y / FIELD_HEIGHT) * 100}%`,
              "--cell-scale": String(geometry.scale),
              "--cell-aspect": String(geometry.aspectRatio),
            } as React.CSSProperties}
          >
            <AnimatePresence mode="wait" initial={false}>
              {item?.kind === "fortune" ? (
                <button
                  type="button"
                  className={`fortune-cookie ${openedCookies.has(item.semanticId) ? "is-open" : ""}`}
                  aria-label={openedCookies.has(item.semanticId) ? item.text : "Open a refreshing angle"}
                  onClick={() => setOpenedCookies((current) => new Set(current).add(item.semanticId))}
                >
                  <span aria-hidden="true">{openedCookies.has(item.semanticId) ? "✦" : "◒"}</span>
                  <span>{openedCookies.has(item.semanticId) ? item.text : item.label}</span>
                </button>
              ) : item ? (
                <CellContent
                  item={item}
                  phase={phase}
                  questionRef={questionRef}
                  onSelect={onSelect}
                  onReviseSelection={onReviseSelection}
                  onOpenLens={onOpenLens}
                  onReviewNode={onReviewNode}
                  onToggleDecision={onToggleDecision}
                  expandedDecisionStepIndex={expandedDecisionStepIndex}
                  onCommit={onCommit}
                  onOpenFinish={onOpenFinish}
                  onContinueFromFinish={onContinueFromFinish}
                />
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
