import type { SessionState } from "./session-types";
import { MAX_CORE_ROUNDS } from "../../shared/limits";

export type ProgressView = {
  dilemma: string;
  completed: number;
  status:
    | "Starting out"
    | "Exploring"
    | "Connecting the dots"
    | "A direction is forming"
    | "Looking once more"
    | "Ready to reflect";
  answers: string[];
};

export const selectProgress = (state: SessionState): ProgressView => {
  let status: ProgressView["status"] = "Starting out";
  if (state.history.length === 1) status = "Exploring";
  if (state.history.length >= 2) status = "Connecting the dots";
  if (state.phase === "clarity-offered") status = "A direction is forming";
  if (state.extensionUsed && state.phase !== "ending" && state.phase !== "generating-summary") {
    status = "Looking once more";
  }
  if (state.phase === "generating-summary" || state.phase === "ending") status = "Ready to reflect";

  return {
    dilemma: state.dilemma,
    completed: state.history.length,
    status,
    answers: state.history.map((step) => step.answer),
  };
};

export const selectCanFinish = (state: SessionState) =>
  (state.phase === "lens-ready" || state.phase === "round-ready") && state.history.length >= 2 && !state.extensionUsed;

export const selectCanExtend = (state: SessionState) =>
  state.phase === "ending" &&
  state.history.length < MAX_CORE_ROUNDS &&
  !state.extensionUsed &&
  Boolean(state.summary?.doubts[0]);
