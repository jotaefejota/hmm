import type { DiscoveryPayload } from "../../shared/ai-contract";
import type { ReflectionStep, SelectedAnswer, SessionPhase } from "../session/session-types";
import {
  CELL_SLOTS,
  DILEMMA_CELL_ID,
  getCellSlot,
  getCustomAnswerCellId,
  getContinueCellId,
  getFinishCellId,
  getFortuneCellId,
  getLensCellIds,
  getQuestionCellId,
  getSuggestionCellIds,
  type CellSlot,
  type RouteStep,
} from "./cell-field";

export type CanvasOccupancy = {
  cellId: string;
  semanticId: string;
  kind: "dilemma" | "lens" | "preview" | "question" | "suggestion" | "custom" | "answer" | "decision" | "fortune" | "finish" | "continue";
  status: "active" | "selected" | "previous" | "clearing";
  text: string;
  label: string;
  age: number;
  interactive: boolean;
  optionIndex?: 0 | 1 | 2;
  lensIndex?: 0 | 1;
  stepIndex?: number;
  reviewKind?: "question" | "answer";
  revisionStepIndex?: number;
  round?: number;
};

export type CanvasEdge = { id: string; from: CellSlot; to: CellSlot; status: "origin" | "active" | "previous" };
export type CanvasProjection = {
  cells: readonly CellSlot[];
  occupancy: CanvasOccupancy[];
  edges: CanvasEdge[];
  /** The anchor for local pressure. */
  focusCellId: string;
  /** A compact group which should be kept together in the viewport. */
  frameCellIds?: readonly string[];
};

type ProjectCanvasInput = {
  dilemma: string;
  history: ReflectionStep[];
  currentDiscovery: DiscoveryPayload | null;
  selectedLensIndex: 0 | 1 | null;
  phase: SessionPhase;
  selectedAnswer: SelectedAnswer | null;
  fortuneSeed?: number;
  focusOverrideCellId?: string | null;
  expandedDecisionStepIndex?: number | null;
  suppressCurrentDiscovery?: boolean;
};

const edge = (id: string, fromCellId: string, toCellId: string, status: CanvasEdge["status"]): CanvasEdge =>
  ({ id, from: getCellSlot(fromCellId), to: getCellSlot(toCellId), status });

/**
 * Makes one fortune available in progressively smaller round windows without
 * changing its answer data. A seed is chosen once when the user starts a
 * session, so a rerender, review, or return-to-lenses action cannot reshuffle it.
 */
export function shouldShowFortune(round: number, seed: number) {
  // The first discovery establishes the core interaction without a side path.
  if (round <= 4) return round >= 2 && round === 2 + (seed % 3);
  if (round <= 7) return round === 5 + (Math.floor(seed / 4) % 3);
  const windowStart = 8 + Math.floor((round - 8) / 2) * 2;
  const windowOffset = Math.floor(seed / (12 + Math.floor((round - 8) / 2))) % 2;
  return round === windowStart + windowOffset;
}

export function projectCanvas({
  dilemma, history, currentDiscovery, selectedLensIndex, phase, selectedAnswer, fortuneSeed = 0, focusOverrideCellId = null, expandedDecisionStepIndex = null, suppressCurrentDiscovery = false,
}: ProjectCanvasInput): CanvasProjection {
  const occupancy: CanvasOccupancy[] = [{
    cellId: DILEMMA_CELL_ID, semanticId: "dilemma", kind: "dilemma", status: "previous",
    text: dilemma, label: "", age: history.length * 2 + 1, interactive: false,
  }];
  const edges: CanvasEdge[] = [];
  const completed: RouteStep[] = [];
  let previousCellId = DILEMMA_CELL_ID;

  history.forEach((step, index) => {
    const questionCellId = getQuestionCellId(step.round, completed, step.lensIndex);
    const answerCellId = getSuggestionCellIds(step.round, completed, step.lensIndex)[step.choiceIndex];
    const age = (history.length - index) * 2;
    const isExpanded = expandedDecisionStepIndex === index;
    if (isExpanded) {
      const options = step.options?.length === 3
        ? step.options
        : [step.answer, "", ""];
      occupancy.push(
        { cellId: questionCellId, semanticId: `question-${step.round}`, kind: "question", status: "active", text: step.question, label: step.lensTheme, age, interactive: true, lensIndex: step.lensIndex, stepIndex: index, reviewKind: "question" },
      );
      getSuggestionCellIds(step.round, completed, step.lensIndex).forEach((cellId, optionIndex) => {
        const indexAsChoice = optionIndex as 0 | 1 | 2;
        const isChosen = indexAsChoice === step.choiceIndex;
        occupancy.push({
          cellId,
          semanticId: isChosen ? `answer-${step.round}` : `revision-option-${step.round}-${optionIndex + 1}`,
          kind: "suggestion",
          status: isChosen ? "selected" : "active",
          text: isChosen ? step.answer : options[indexAsChoice],
          label: isChosen ? "Your answer" : "Possibility",
          age: age - 1,
          interactive: isChosen || Boolean(options[indexAsChoice]),
          optionIndex: indexAsChoice,
          stepIndex: index,
          reviewKind: isChosen ? "answer" : undefined,
          revisionStepIndex: isChosen ? undefined : index,
        });
      });
      edges.push(
        edge(`edge-${previousCellId}-${questionCellId}`, previousCellId, questionCellId, index === 0 ? "origin" : "previous"),
      );
      getSuggestionCellIds(step.round, completed, step.lensIndex).forEach((cellId, optionIndex) => {
        edges.push(edge(`edge-${questionCellId}-${cellId}`, questionCellId, cellId, optionIndex === step.choiceIndex ? "previous" : "active"));
      });
    } else {
      occupancy.push({
        cellId: answerCellId,
        semanticId: `decision-${step.round}`,
        kind: "decision",
        status: "selected",
        text: step.answer,
        label: "Settled choice",
        age: age - 1,
        interactive: true,
        optionIndex: step.choiceIndex,
        stepIndex: index,
      });
      edges.push(edge(`edge-${previousCellId}-${answerCellId}`, previousCellId, answerCellId, index === 0 ? "origin" : "previous"));
    }
    previousCellId = answerCellId;
    completed.push({ lensIndex: step.lensIndex, choiceIndex: step.choiceIndex });
  });

  const showsDiscovery = !suppressCurrentDiscovery && currentDiscovery && ["lens-ready", "round-ready", "writing-custom-answer", "answer-selected"].includes(phase);
  if (showsDiscovery && currentDiscovery) {
    const round = history.length + 1;
    const lensCells = getLensCellIds(round, completed);
    if (shouldShowFortune(round, fortuneSeed)) {
      occupancy.push({ cellId: getFortuneCellId(round, completed), semanticId: `fortune-${round}`, kind: "fortune", status: "active", text: currentDiscovery.fortune, label: "A fresh angle", age: 0, interactive: true, round });
    }
    if (phase === "lens-ready" || selectedLensIndex === null) {
      currentDiscovery.lenses.forEach((lens, index) => {
        const lensIndex = index as 0 | 1;
        occupancy.push({ cellId: lensCells[lensIndex], semanticId: `lens-${round}-${index}`, kind: "lens", status: "active", text: lens.theme, label: "Question path", age: 0, interactive: true, lensIndex });
        edges.push(edge(`edge-${previousCellId}-${lensCells[lensIndex]}`, previousCellId, lensCells[lensIndex], "active"));
      });
    } else {
      const lens = currentDiscovery.lenses[selectedLensIndex];
      const questionCellId = lensCells[selectedLensIndex];
      occupancy.push({ cellId: questionCellId, semanticId: `question-${round}`, kind: "question", status: "active", text: lens.question, label: lens.theme, age: 0, interactive: false, lensIndex: selectedLensIndex });
      edges.push(edge(`edge-${previousCellId}-${questionCellId}`, previousCellId, questionCellId, history.length ? "previous" : "origin"));
      lens.answers.forEach((answerText, index) => {
        const optionIndex = index as 0 | 1 | 2;
        const isSelected = phase === "answer-selected" && selectedAnswer?.choiceIndex === optionIndex;
        const isClearing = phase === "answer-selected" && !isSelected;
        const cellId = getSuggestionCellIds(round, completed, selectedLensIndex)[optionIndex];
        occupancy.push({ cellId, semanticId: `suggestion-${round}-${index + 1}`, kind: "suggestion", status: isSelected ? "selected" : isClearing ? "clearing" : "active", text: isSelected ? selectedAnswer.text : answerText, label: isSelected ? "Your answer" : "Possibility", age: 0, interactive: phase !== "answer-selected", optionIndex });
        if (!isClearing) edges.push(edge(`edge-${questionCellId}-${cellId}`, questionCellId, cellId, isSelected ? "previous" : "active"));
      });
      const customCellId = getCustomAnswerCellId(round, completed, selectedLensIndex);
      occupancy.push({
        cellId: customCellId,
        semanticId: `custom-answer-${round}`,
        kind: "custom",
        status: "active",
        text: "Enter your own answer…",
        label: "Possibility",
        age: 0,
        interactive: phase !== "answer-selected",
      });
      edges.push(edge(`edge-${questionCellId}-${customCellId}`, questionCellId, customCellId, "active"));
    }
  }

  if (phase === "generating-round" || (phase === "transitioning" && history.length > 0)) {
    const previewCells = getLensCellIds(history.length + 1, completed);
    previewCells.forEach((cellId, index) => {
      occupancy.push({
        cellId,
        semanticId: `lens-preview-${history.length + 1}-${index + 1}`,
        kind: "preview",
        status: "active",
        text: "",
        label: "",
        age: 0,
        interactive: false,
      });
    });
  }

  if (phase === "finish-offered" && history.length > 0) {
    const finishCellId = getFinishCellId(history);
    occupancy.push({
      cellId: finishCellId,
      semanticId: `finish-${history.length}`,
      kind: "finish",
      status: "active",
      text: "Discover",
      label: "Something is taking shape",
      age: 0,
      interactive: true,
    });
    edges.push(edge(`edge-${previousCellId}-${finishCellId}`, previousCellId, finishCellId, "active"));
    if (currentDiscovery) {
      occupancy.push({
        cellId: getContinueCellId(history),
        semanticId: `continue-${history.length}`,
        kind: "continue",
        status: "active",
        text: "Keep exploring",
        label: "",
        age: 0,
        interactive: true,
      });
    }
  }

  const expandedFrameCellIds = expandedDecisionStepIndex === null
    ? []
    : occupancy
      .filter((item) => item.stepIndex === expandedDecisionStepIndex && (item.kind === "question" || item.kind === "suggestion"))
      .map((item) => item.cellId);
  const nextRound = Math.min(history.length + 1, 5);
  const lensCells = getLensCellIds(nextRound, completed);
  const finishCellId = phase === "finish-offered" && history.length > 0 ? getFinishCellId(history) : null;
  const settlesOnTrailEnd = phase === "generating-summary" || phase === "ending";
  const defaultFocusCellId = finishCellId ?? (settlesOnTrailEnd ? previousCellId : selectedLensIndex === null ? lensCells[0] : lensCells[selectedLensIndex]);
  const expandedQuestionCellId = expandedFrameCellIds.find((cellId) => occupancy.some((item) => item.cellId === cellId && item.kind === "question"));
  const derivedFocusCellId = expandedQuestionCellId ?? defaultFocusCellId;
  const requestedFocusCellId = focusOverrideCellId && CELL_SLOTS.some((slot) => slot.id === focusOverrideCellId)
    ? focusOverrideCellId
    : derivedFocusCellId;
  return {
    cells: CELL_SLOTS, occupancy, edges,
    focusCellId: expandedQuestionCellId ?? requestedFocusCellId,
    frameCellIds: expandedFrameCellIds.length > 1 ? expandedFrameCellIds : [requestedFocusCellId],
  };
}
