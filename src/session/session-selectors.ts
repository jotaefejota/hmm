import type { SessionState } from "./session-types";

export type ProgressView = {
  dilemma: string;
  completed: number;
  status: string;
  isThinking: boolean;
  answers: string[];
};

export const selectProgress = (state: SessionState): ProgressView => {
  let status: ProgressView["status"] = "Starting out";
  if (state.history.length === 1) status = "Exploring";
  if (state.history.length >= 2) status = "Connecting the dots";
  if (state.phase === "generating-round") status = "Hmm… where’s the useful edge?";
  if (state.phase === "transitioning") status = state.pendingDiscovery?.transition ?? "Following that thread…";
  if (state.phase === "finish-offered") status = "A direction is forming";
  if (state.extensionUsed && state.phase !== "ending" && state.phase !== "generating-summary") {
    status = "Looking once more";
  }
  if (state.phase === "generating-summary") status = "Gathering your thoughts…";
  if (state.phase === "ending") status = "A reflection is ready";

  return {
    dilemma: state.dilemma,
    completed: state.history.length,
    status,
    isThinking: state.phase === "generating-round" || state.phase === "transitioning" || state.phase === "generating-summary",
    answers: state.history.map((step) => step.answer),
  };
};

export const selectCanFinish = (state: SessionState) =>
  (state.phase === "lens-ready" || state.phase === "round-ready") && state.history.length >= 2 && !state.extensionUsed;

export const selectCanExtend = (state: SessionState) =>
  state.phase === "ending" &&
  !state.extensionUsed &&
  Boolean(state.summary?.doubts[0]);
