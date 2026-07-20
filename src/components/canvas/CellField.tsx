import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CanvasOccupancy, CanvasProjection } from "../../layout/projectCanvas";
import { CELL_SIZE_RATIO, FIELD_HEIGHT, FIELD_WIDTH, getCellSlot } from "../../layout/cell-field";
import { getSelectionConsolidation, type SelectionConsolidation } from "../../layout/selection-consolidation";
import { ConnectionLayer } from "./ConnectionLayer";

type CellFieldProps = {
  projection: CanvasProjection;
  phase: "lens-ready" | "round-ready" | "writing-custom-answer" | "answer-selected" | "transitioning" | "finish-offered" | "generating-summary" | "ending";
  questionRef?: React.RefObject<HTMLHeadingElement | null>;
  onSelect?: (answer: string) => void;
  onOpenLens?: (lensIndex: 0 | 1) => void;
  onReviewNode?: (stepIndex: number, focusKind: "question" | "answer") => void;
  onCommit?: () => void;
  onOpenFinish?: () => void;
  onContinueFromFinish?: () => void;
  ending?: boolean;
  reviewCellId?: string | null;
};

type SelectionSnapshot = {
  key: string;
  questionCellId: string;
  answerCellId: string;
  consolidation: SelectionConsolidation;
};

function selectionSnapshot(projection: CanvasProjection): SelectionSnapshot | null {
  const selection = projection.selectionConsolidation;
  if (!selection) return null;
  return {
    key: selection.key,
    questionCellId: selection.questionCellId,
    answerCellId: selection.answerCellId,
    consolidation: getSelectionConsolidation(getCellSlot(selection.questionCellId), getCellSlot(selection.answerCellId)),
  };
}

function SelectionMembrane({
  snapshot,
  phase,
  onSettled,
}: {
  snapshot: SelectionSnapshot;
  phase: CellFieldProps["phase"];
  onSettled?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const isSelecting = phase === "answer-selected";
  return (
    <motion.svg
      className="selection-membrane"
      viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: isSelecting ? [0, 0.3, 0.82] : [0.82, 0.22], scale: isSelecting ? [0.94, 1.015, 1] : [1, 0.98] }}
      transition={{ duration: reducedMotion ? 0.12 : isSelecting ? 0.72 : 0.44, times: isSelecting ? [0, 0.46, 1] : [0, 1], ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => { if (isSelecting) onSettled?.(); }}
    >
      <motion.path
        initial={{ d: snapshot.consolidation.startPath }}
        animate={{ d: isSelecting ? snapshot.consolidation.consolidatedPath : snapshot.consolidation.startPath }}
        transition={{ duration: reducedMotion ? 0.12 : isSelecting ? 0.72 : 0.44, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  );
}

function CellContent({
  item,
  phase,
  questionRef,
  onSelect,
  onOpenLens,
  onReviewNode,
  onCommit,
  onOpenFinish,
  onContinueFromFinish,
}: {
  item: CanvasOccupancy;
  phase: CellFieldProps["phase"];
  questionRef?: CellFieldProps["questionRef"];
  onSelect?: (answer: string) => void;
  onOpenLens?: (lensIndex: 0 | 1) => void;
  onReviewNode?: (stepIndex: number, focusKind: "question" | "answer") => void;
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
        onClick={() => { if (item.interactive) onSelect?.(item.text); }}
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

  if (item.interactive && item.stepIndex !== undefined && item.reviewKind) {
    return (
      <motion.button
        key={item.semanticId}
        data-history-node={item.semanticId}
        className={`${className} history-cell-action`}
        type="button"
        aria-label={`Review round ${item.stepIndex + 1}: ${item.text}`}
        onClick={() => onReviewNode?.(item.stepIndex!, item.reviewKind!)}
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
  onOpenLens,
  onReviewNode,
  onCommit,
  onOpenFinish,
  onContinueFromFinish,
  ending = false,
  reviewCellId = null,
}: CellFieldProps) {
  const focusedSlot = getCellSlot(projection.focusCellId);
  const visibleLensSlots = phase === "lens-ready"
    ? projection.occupancy.filter((item) => item.kind === "lens").map((item) => getCellSlot(item.cellId))
    : [];
  const focus = visibleLensSlots.length === 2
    ? { x: (visibleLensSlots[0].x + visibleLensSlots[1].x) / 2, y: (visibleLensSlots[0].y + visibleLensSlots[1].y) / 2 }
    : focusedSlot;
  const [openedCookies, setOpenedCookies] = useState<Set<string>>(() => new Set());
  const consolidationSnapshot = selectionSnapshot(projection);

  const commitConsolidation = () => {
    if (phase !== "answer-selected" || !consolidationSnapshot) return;
    onCommit?.();
  };

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
      <ConnectionLayer edges={projection.edges} />
      {consolidationSnapshot ? (
        <SelectionMembrane snapshot={consolidationSnapshot} phase={phase} onSettled={commitConsolidation} />
      ) : null}
      {projection.cells.map((slot) => {
        const item = projection.occupancy.find((candidate) => candidate.cellId === slot.id);
        const isReviewTarget = reviewCellId === slot.id;
        const isSelectionQuestion = phase === "answer-selected" && consolidationSnapshot?.questionCellId === slot.id;
        const isSelectionAnswer = phase === "answer-selected" && consolidationSnapshot?.answerCellId === slot.id;
        const isTransitionSource = phase === "transitioning" && (consolidationSnapshot?.questionCellId === slot.id || consolidationSnapshot?.answerCellId === slot.id);
        const cellClass = item
          ? `is-occupied is-${item.kind} is-${item.status}${isReviewTarget ? " is-review-focus" : ""}${isSelectionQuestion ? " is-consolidating-question" : ""}${isSelectionAnswer ? " is-selection-pulling" : ""}${isTransitionSource ? " is-consolidating-source" : ""}`
          : "is-empty";
        return (
          <div
            key={slot.id}
            data-cell-slot={slot.id}
            className={`field-cell field-cell-${slot.size} field-role-${slot.role} shape-${slot.shape} ${cellClass}`}
            style={{
              "--cell-x": `${(slot.x / FIELD_WIDTH) * 100}%`,
              "--cell-y": `${(slot.y / FIELD_HEIGHT) * 100}%`,
              "--selection-pull-x": `${isSelectionAnswer ? consolidationSnapshot!.consolidation.answerPull.x : 0}vw`,
              "--selection-pull-y": `${isSelectionAnswer ? consolidationSnapshot!.consolidation.answerPull.y : 0}vw`,
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
                  onOpenLens={onOpenLens}
                  onReviewNode={onReviewNode}
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
