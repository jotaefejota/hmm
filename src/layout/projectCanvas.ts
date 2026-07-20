import type { DiscoveryPayload } from "../../shared/ai-contract";
import type { ReflectionStep, SelectedAnswer, SessionPhase } from "../session/session-types";
import {
  CELL_SLOTS,
  DILEMMA_CELL_ID,
  getCellSlot,
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
  kind: "dilemma" | "lens" | "question" | "suggestion" | "answer" | "decision" | "fortune" | "finish" | "continue";
  status: "active" | "selected" | "previous" | "clearing";
  text: string;
  label: string;
  age: number;
  interactive: boolean;
  optionIndex?: 0 | 1 | 2;
  lensIndex?: 0 | 1;
  stepIndex?: number;
  reviewKind?: "question" | "answer";
};

export type CanvasEdge = { id: string; from: CellSlot; to: CellSlot; status: "origin" | "active" | "previous" };
export type CanvasProjection = { cells: readonly CellSlot[]; occupancy: CanvasOccupancy[]; edges: CanvasEdge[]; focusCellId: string };

type ProjectCanvasInput = {
  dilemma: string;
  history: ReflectionStep[];
  currentDiscovery: DiscoveryPayload | null;
  selectedLensIndex: 0 | 1 | null;
  phase: SessionPhase;
  selectedAnswer: SelectedAnswer | null;
  focusOverrideCellId?: string | null;
  expandedDecisionStepIndex?: number | null;
};

const edge = (id: string, fromCellId: string, toCellId: string, status: CanvasEdge["status"]): CanvasEdge =>
  ({ id, from: getCellSlot(fromCellId), to: getCellSlot(toCellId), status });

export function projectCanvas({
  dilemma, history, currentDiscovery, selectedLensIndex, phase, selectedAnswer, focusOverrideCellId = null, expandedDecisionStepIndex = null,
}: ProjectCanvasInput): CanvasProjection {
  const occupancy: CanvasOccupancy[] = [{
    cellId: DILEMMA_CELL_ID, semanticId: "dilemma", kind: "dilemma", status: "previous",
    text: dilemma, label: "You brought", age: history.length * 2 + 1, interactive: false,
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
      occupancy.push(
        { cellId: questionCellId, semanticId: `question-${step.round}`, kind: "question", status: "previous", text: step.question, label: `${step.lensTheme} · ${step.round}`, age, interactive: true, lensIndex: step.lensIndex, stepIndex: index, reviewKind: "question" },
        { cellId: answerCellId, semanticId: `answer-${step.round}`, kind: "answer", status: "selected", text: step.answer, label: `You chose · ${step.round}`, age: age - 1, interactive: true, optionIndex: step.choiceIndex, stepIndex: index, reviewKind: "answer" },
      );
      edges.push(
        edge(`edge-${previousCellId}-${questionCellId}`, previousCellId, questionCellId, index === 0 ? "origin" : "previous"),
        edge(`edge-${questionCellId}-${answerCellId}`, questionCellId, answerCellId, "previous"),
      );
    } else {
      occupancy.push({
        cellId: answerCellId,
        semanticId: `decision-${step.round}`,
        kind: "decision",
        status: "selected",
        text: step.answer,
        label: `Settled choice · ${step.round}`,
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

  const showsDiscovery = currentDiscovery && ["lens-ready", "round-ready", "writing-custom-answer", "answer-selected"].includes(phase);
  if (showsDiscovery && currentDiscovery) {
    const round = history.length + 1;
    const lensCells = getLensCellIds(round, completed);
    occupancy.push({ cellId: getFortuneCellId(round, completed), semanticId: `fortune-${round}`, kind: "fortune", status: "active", text: currentDiscovery.fortune, label: "A fresh angle", age: 0, interactive: true });
    if (phase === "lens-ready" || selectedLensIndex === null) {
      currentDiscovery.lenses.forEach((lens, index) => {
        const lensIndex = index as 0 | 1;
        occupancy.push({ cellId: lensCells[lensIndex], semanticId: `lens-${round}-${index}`, kind: "lens", status: "active", text: lens.theme, label: `Question path ${index + 1}`, age: 0, interactive: true, lensIndex });
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
        occupancy.push({ cellId, semanticId: `suggestion-${round}-${index + 1}`, kind: "suggestion", status: isSelected ? "selected" : isClearing ? "clearing" : "active", text: isSelected ? selectedAnswer.text : answerText, label: isSelected ? "Your answer" : `Possibility ${index + 1}`, age: 0, interactive: phase !== "answer-selected", optionIndex });
        if (!isClearing) edges.push(edge(`edge-${questionCellId}-${cellId}`, questionCellId, cellId, isSelected ? "previous" : "active"));
      });
    }
  }

  if (phase === "finish-offered" && history.length > 0) {
    const finishCellId = getFinishCellId(history);
    occupancy.push({
      cellId: finishCellId,
      semanticId: `finish-${history.length}`,
      kind: "finish",
      status: "active",
      text: history.length >= 5 ? "Let this settle" : "What is taking shape?",
      label: "Reflection lens",
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
        text: "Keep going",
        label: "Continue exploring",
        age: 0,
        interactive: true,
      });
    }
  }

  const nextRound = Math.min(history.length + 1, 5);
  const lensCells = getLensCellIds(nextRound, completed);
  const finishCellId = phase === "finish-offered" && history.length > 0 ? getFinishCellId(history) : null;
  const settlesOnTrailEnd = phase === "generating-summary" || phase === "ending";
  const derivedFocusCellId = finishCellId ?? (settlesOnTrailEnd ? previousCellId : selectedLensIndex === null ? lensCells[0] : lensCells[selectedLensIndex]);
  return {
    cells: CELL_SLOTS, occupancy, edges,
    focusCellId: focusOverrideCellId && CELL_SLOTS.some((slot) => slot.id === focusOverrideCellId) ? focusOverrideCellId : derivedFocusCellId,
  };
}
