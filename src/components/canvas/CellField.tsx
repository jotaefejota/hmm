import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CanvasOccupancy, CanvasProjection } from "../../layout/projectCanvas";
import { CELL_SIZE_RATIO, FIELD_HEIGHT, FIELD_WIDTH, getCellSlot } from "../../layout/cell-field";
import { geometryForCell } from "../../layout/cell-geometry";
import { settleLocalPressure } from "../../layout/pressure-layout";
import { ConnectionLayer } from "./ConnectionLayer";

type CellFieldProps = {
  projection: CanvasProjection;
  phase: "generating-round" | "lens-ready" | "round-ready" | "writing-custom-answer" | "answer-selected" | "transitioning" | "finish-offered" | "generating-summary" | "ending";
  questionRef?: React.RefObject<HTMLHeadingElement | null>;
  onSelect?: (answer: string) => void;
  onOpenCustomAnswer?: () => void;
  onReviseSelection?: (stepIndex: number, choiceIndex: 0 | 1 | 2) => void;
  onOpenLens?: (lensIndex: 0 | 1) => void;
  onOpenFortune?: (round: number, text: string) => void;
  onReturnToLenses?: () => void;
  onExitExpandedDecision?: () => void;
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
  onOpenCustomAnswer,
  onReviseSelection,
  onOpenLens,
  onReturnToLenses,
  onExitExpandedDecision,
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
  onOpenCustomAnswer?: () => void;
  onReviseSelection?: (stepIndex: number, choiceIndex: 0 | 1 | 2) => void;
  onOpenLens?: (lensIndex: 0 | 1) => void;
  onReturnToLenses?: () => void;
  onExitExpandedDecision?: () => void;
  onReviewNode?: (stepIndex: number, focusKind: "question" | "answer") => void;
  onToggleDecision?: (stepIndex: number) => void;
  expandedDecisionStepIndex?: number | null;
  onCommit?: () => void;
  onOpenFinish?: () => void;
  onContinueFromFinish?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const isFocusedQuestion = item.kind === "question" && item.status === "active";
  const isLiveActiveQuestion = isFocusedQuestion && item.stepIndex === undefined;
  const isInitialDilemma = item.kind === "dilemma" && phase === "generating-round";
  const isSelected = item.status === "selected";
  const targetOpacity = item.status === "clearing" ? 0 : item.age > 0 ? Math.max(0.6, 1 - item.age * 0.055) : 1;
  const className = `cell-content content-${item.kind} status-${item.status}`;
  const transition = { duration: reducedMotion ? 0.12 : isSelected ? 0.48 : 0.34, ease: [0.22, 1, 0.36, 1] as const };
  const body = (
    <>
      {isFocusedQuestion ? <span className="question-pin" aria-hidden="true">?</span> : null}
      {item.label ? <span className="node-label">{item.label}</span> : null}
      {isSelected ? <span className="selection-check" aria-hidden="true">✓</span> : null}
      {isLiveActiveQuestion ? (
        <h1 id="active-question" ref={questionRef} tabIndex={-1}>{item.text}</h1>
      ) : (
        <span className={`node-copy${isFocusedQuestion ? " node-copy-question" : ""}`}>{item.text}</span>
      )}
    </>
  );

  if (item.kind === "suggestion") {
    return (
      <motion.button
        key={item.semanticId}
        className={className}
        type="button"
        aria-label={item.stepIndex !== undefined && item.status === "selected"
          ? `Settle decision from round ${item.stepIndex + 1}: ${item.text}`
          : `${item.label}: ${item.text}`}
        disabled={!item.interactive}
        onClick={() => {
          if (!item.interactive) return;
          if (item.stepIndex !== undefined && item.status === "selected") {
            onToggleDecision?.(item.stepIndex);
            return;
          }
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

  if (item.kind === "custom") {
    return (
      <button
        key={item.semanticId}
        className={className}
        type="button"
        aria-label="Possibility: Enter your own answer"
        disabled={!item.interactive}
        onClick={onOpenCustomAnswer}
      >
        {body}
      </button>
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

  if (item.kind === "question" && item.stepIndex === undefined && item.lensIndex !== undefined) {
    return (
      <motion.button
        key={item.semanticId}
        className={`${className} active-question-toggle`}
        type="button"
        aria-label={`Close ${item.label} and show both question paths`}
        onClick={onReturnToLenses}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: targetOpacity, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={transition}
      >
        {body}
      </motion.button>
    );
  }

  if (item.kind === "preview") {
    return (
      <motion.article
        key={item.semanticId}
        className={`${className} lens-preview-content`}
        aria-label="Preparing the next paths"
        initial={{ opacity: 0, scale: 0.84 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={transition}
      >
      </motion.article>
    );
  }

  if (item.kind === "finish") {
    return (
      <motion.button
        key={item.semanticId}
        className={className}
        type="button"
        aria-label="Discover what is taking shape"
        onClick={onOpenFinish}
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={transition}
      >
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
          ? item.reviewKind === "question"
            ? onExitExpandedDecision?.()
            : onToggleDecision?.(item.stepIndex!)
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
      initial={{ opacity: isInitialDilemma ? 1 : 0, scale: isInitialDilemma || reducedMotion ? 1 : 0.92 }}
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
  onOpenCustomAnswer,
  onReviseSelection,
  onOpenLens,
  onOpenFortune,
  onReturnToLenses,
  onExitExpandedDecision,
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
  const frameCellIds = projection.frameCellIds ?? [projection.focusCellId];
  const visibleLensSlots = phase === "lens-ready"
    ? projection.occupancy.filter((item) => item.kind === "lens").map((item) => getCellSlot(item.cellId))
    : [];
  const focusedPosition = pressurePositions.get(focusedSlot.id) ?? focusedSlot;
  const framePositions = frameCellIds
    .map((cellId) => {
      const slot = getCellSlot(cellId);
      return pressurePositions.get(cellId) ?? slot;
    });
  const framedPosition = framePositions.length > 1
    ? (() => {
      const xs = framePositions.map((position) => position.x);
      const ys = framePositions.map((position) => position.y);
      return {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
      };
    })()
    : focusedPosition;
  // The lens pair owns the default "now" camera, but an explicit progress-card
  // review target must always win—even while the next two lenses are visible.
  const focus = frameCellIds.length > 1
    ? framedPosition
    : !reviewCellId && visibleLensSlots.length === 2
    ? (() => {
      const first = pressurePositions.get(visibleLensSlots[0].id) ?? visibleLensSlots[0];
      const second = pressurePositions.get(visibleLensSlots[1].id) ?? visibleLensSlots[1];
      return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    })()
    : focusedPosition;
  const [openedCookies, setOpenedCookies] = useState<Set<string>>(() => new Set());
  const [revealingCookies, setRevealingCookies] = useState<Set<string>>(() => new Set());

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
        const liveClass = item?.stepIndex === undefined ? " is-live" : "";
        const lensClass = item?.lensIndex !== undefined ? ` lens-index-${item.lensIndex}` : "";
        const optionClass = item?.optionIndex !== undefined ? ` option-index-${item.optionIndex}` : "";
        const cellClass = item
          ? `is-occupied is-${item.kind} is-${item.status}${liveClass}${lensClass}${optionClass}${isReviewTarget ? " is-review-focus" : ""}`
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
                  className={`fortune-cookie ${openedCookies.has(item.semanticId) ? "is-open" : ""}${revealingCookies.has(item.semanticId) ? " is-revealing" : ""}`}
                  aria-label={openedCookies.has(item.semanticId) ? item.text : "Open a refreshing angle"}
                  onClick={() => {
                    setOpenedCookies((current) => new Set(current).add(item.semanticId));
                    setRevealingCookies((current) => new Set(current).add(item.semanticId));
                    if (item.round !== undefined) onOpenFortune?.(item.round, item.text);
                  }}
                  onAnimationEnd={() => setRevealingCookies((current) => {
                    if (!current.has(item.semanticId)) return current;
                    const next = new Set(current);
                    next.delete(item.semanticId);
                    return next;
                  })}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={openedCookies.has(item.semanticId) ? item.text : item.label}
                      initial={{ opacity: 0, y: 5, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -3, scale: 0.95 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >{openedCookies.has(item.semanticId) ? item.text : item.label}</motion.span>
                  </AnimatePresence>
                </button>
              ) : item ? (
                <CellContent
                  item={item}
                  phase={phase}
                  questionRef={questionRef}
                  onSelect={onSelect}
                  onOpenCustomAnswer={onOpenCustomAnswer}
                  onReviseSelection={onReviseSelection}
                  onOpenLens={onOpenLens}
                  onReturnToLenses={onReturnToLenses}
                  onExitExpandedDecision={onExitExpandedDecision}
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
