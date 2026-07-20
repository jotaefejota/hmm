import type { SessionState } from "./session-types";

export type ProgressView = {
  dilemma: string;
  completed: number;
  status: "Starting out" | "Exploring" | "Connecting the dots" | "A direction is forming" | "Ready to reflect";
  answers: string[];
};

export const selectProgress = (state: SessionState): ProgressView => {
  let status: ProgressView["status"] = "Starting out";
  if (state.history.length === 1) status = "Exploring";
  if (state.history.length >= 2) status = "Connecting the dots";
  if (state.phase === "clarity-offered") status = "A direction is forming";
  if (state.phase === "generating-summary" || state.phase === "ending") status = "Ready to reflect";

  return {
    dilemma: state.dilemma,
    completed: state.history.length,
    status,
    answers: state.history.map((step) => step.answer),
  };
};

export const selectCanFinish = (state: SessionState) =>
  state.phase === "round-ready" && state.history.length >= 2;
