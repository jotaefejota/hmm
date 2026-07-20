import type { RoundPayload } from "../../shared/ai-contract";
import type { ReflectionStep, SelectedAnswer, SessionPhase } from "../session/session-types";
import {
  CELL_SLOTS,
  DILEMMA_CELL_ID,
  getCellSlot,
  getQuestionCellId,
  getSuggestionCellIds,
  type CellSlot,
} from "./cell-field";

export type CanvasOccupancy = {
  cellId: string;
  semanticId: string;
  kind: "dilemma" | "question" | "suggestion" | "answer";
  status: "active" | "selected" | "previous" | "clearing";
  text: string;
  label: string;
  age: number;
  interactive: boolean;
  optionIndex?: 0 | 1 | 2;
};

export type CanvasEdge = {
  id: string;
  from: CellSlot;
  to: CellSlot;
  status: "origin" | "active" | "previous";
};

export type CanvasProjection = {
  cells: readonly CellSlot[];
  occupancy: CanvasOccupancy[];
  edges: CanvasEdge[];
  focusCellId: string;
};

type ProjectCanvasInput = {
  dilemma: string;
  history: ReflectionStep[];
  currentRound: RoundPayload | null;
  phase: SessionPhase;
  selectedAnswer: SelectedAnswer | null;
  focusOverrideCellId?: string | null;
};

function edge(id: string, fromCellId: string, toCellId: string, status: CanvasEdge["status"]): CanvasEdge {
  return { id, from: getCellSlot(fromCellId), to: getCellSlot(toCellId), status };
}

export function projectCanvas({
  dilemma,
  history,
  currentRound,
  phase,
  selectedAnswer,
  focusOverrideCellId = null,
}: ProjectCanvasInput): CanvasProjection {
  const occupancy: CanvasOccupancy[] = [{
    cellId: DILEMMA_CELL_ID,
    semanticId: "dilemma",
    kind: "dilemma",
    status: "previous",
    text: dilemma,
    label: "You brought",
    age: history.length * 2 + 1,
    interactive: false,
  }];
  const edges: CanvasEdge[] = [];
  let previousCellId = DILEMMA_CELL_ID;
  const committedChoices: (0 | 1 | 2)[] = [];

  history.forEach((step, index) => {
    const questionCellId = getQuestionCellId(step.round, committedChoices);
    const suggestionCellIds = getSuggestionCellIds(step.round, committedChoices);
    const answerCellId = suggestionCellIds[step.choiceIndex];
    const age = (history.length - index) * 2;
    occupancy.push(
      {
        cellId: questionCellId,
        semanticId: `question-${step.round}`,
        kind: "question",
        status: "previous",
        text: step.question,
        label: `Hmm… asked · ${step.round}`,
        age,
        interactive: false,
      },
      {
        cellId: answerCellId,
        semanticId: `answer-${step.round}`,
        kind: "answer",
        status: "selected",
        text: step.answer,
        label: `You chose · ${step.round}`,
        age: age - 1,
        interactive: false,
        optionIndex: step.choiceIndex,
      },
    );
    edges.push(
      edge(`edge-${previousCellId}-${questionCellId}`, previousCellId, questionCellId, index === 0 ? "origin" : "previous"),
      edge(`edge-${questionCellId}-${answerCellId}`, questionCellId, answerCellId, "previous"),
    );
    previousCellId = answerCellId;
    committedChoices.push(step.choiceIndex);
  });

  const showsRound = currentRound && ["round-ready", "writing-custom-answer", "answer-selected"].includes(phase);
  if (showsRound && currentRound) {
    const roundNumber = history.length + 1;
    const questionCellId = getQuestionCellId(roundNumber, committedChoices);
    const suggestionCellIds = getSuggestionCellIds(roundNumber, committedChoices);
    occupancy.push({
      cellId: questionCellId,
      semanticId: `question-${roundNumber}`,
      kind: "question",
      status: "active",
      text: currentRound.question,
      label: "Hmm… asks",
      age: 0,
      interactive: false,
    });
    edges.push(edge(`edge-${previousCellId}-${questionCellId}`, previousCellId, questionCellId, history.length ? "previous" : "origin"));

    currentRound.answers.forEach((answerText, index) => {
      const optionIndex = index as 0 | 1 | 2;
      const isSelected = phase === "answer-selected" && selectedAnswer?.choiceIndex === optionIndex;
      const isClearing = phase === "answer-selected" && !isSelected;
      const cellId = suggestionCellIds[optionIndex];
      occupancy.push({
        cellId,
        semanticId: `suggestion-${roundNumber}-${index + 1}`,
        kind: "suggestion",
        status: isSelected ? "selected" : isClearing ? "clearing" : "active",
        text: isSelected ? selectedAnswer.text : answerText,
        label: isSelected ? "Your answer" : `Possibility ${index + 1}`,
        age: 0,
        interactive: phase !== "answer-selected",
        optionIndex,
      });
      if (!isClearing) {
        edges.push(edge(`edge-${questionCellId}-${cellId}`, questionCellId, cellId, isSelected ? "previous" : "active"));
      }
    });
  }

  const nextRound = Math.min(history.length + 1, 5);
  const focusChoices = committedChoices.slice(0, nextRound - 1);
  const settlesOnTrailEnd = phase === "clarity-offered" || phase === "generating-summary" || phase === "ending";
  const derivedFocusCellId = settlesOnTrailEnd
    ? previousCellId
    : getQuestionCellId(nextRound, focusChoices);
  return {
    cells: CELL_SLOTS,
    occupancy,
    edges,
    focusCellId: focusOverrideCellId && CELL_SLOTS.some((slot) => slot.id === focusOverrideCellId)
      ? focusOverrideCellId
      : derivedFocusCellId,
  };
}
