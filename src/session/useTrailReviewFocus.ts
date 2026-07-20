import { useState } from "react";
import { getHistoryAnswerCellId } from "../layout/cell-field";
import type { SessionState } from "../session/session-types";

const sessionKeyFor = (state: SessionState) =>
  `${state.phase}|${state.history.length}|${state.activeRequestId}|${state.currentRound?.question ?? ""}`;

export function useTrailReviewFocus(state: SessionState) {
  const sessionKey = sessionKeyFor(state);
  const [review, setReview] = useState<{ sessionKey: string; cellId: string } | null>(null);
  const reviewCellId = review?.sessionKey === sessionKey ? review.cellId : null;

  const focusHistoryAnswer = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= state.history.length) return;
    setReview({
      sessionKey,
      cellId: getHistoryAnswerCellId(state.history, stepIndex),
    });
  };

  const clearReviewFocus = () => setReview(null);

  return {
    reviewCellId,
    isReviewing: reviewCellId !== null,
    focusHistoryAnswer,
    clearReviewFocus,
  };
}
