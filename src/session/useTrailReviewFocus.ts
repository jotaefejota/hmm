import { useState } from "react";
import { getHistoryCellId } from "../layout/cell-field";
import type { SessionState } from "./session-types";

export type TrailReview = { stepIndex: number; focusKind: "question" | "answer"; cellId: string };

const sessionKeyFor = (state: SessionState) =>
  // A review anchor is derived solely from the canonical trail. It must remain
  // stable while the canvas transitions, unfolds another decision, or loads
  // the next discovery; it becomes invalid only when the actual trail changes.
  state.history.map((step) => `${step.round}:${step.lensIndex}:${step.choiceIndex}:${step.answer}`).join("|");

export function useTrailReviewFocus(state: SessionState) {
  const sessionKey = sessionKeyFor(state);
  const [stored, setStored] = useState<{ sessionKey: string; review: TrailReview } | null>(null);
  const review = stored?.sessionKey === sessionKey ? stored.review : null;

  const focusHistoryNode = (stepIndex: number, focusKind: "question" | "answer" = "answer") => {
    if (stepIndex < 0 || stepIndex >= state.history.length) return;
    setStored({ sessionKey, review: { stepIndex, focusKind, cellId: getHistoryCellId(state.history, stepIndex, focusKind) } });
  };

  return {
    review,
    reviewCellId: review?.cellId ?? null,
    isReviewing: review !== null,
    focusHistoryAnswer: (stepIndex: number) => focusHistoryNode(stepIndex, "answer"),
    focusHistoryNode,
    clearReviewFocus: () => setStored(null),
  };
}
