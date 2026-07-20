import type { SessionState } from "./session-types";

export type ProgressView = {
  dilemma: string;
  completed: number;
  status: "Starting out";
  answers: string[];
};

export const selectProgress = (state: SessionState): ProgressView => ({
  dilemma: state.dilemma,
  completed: state.history.length,
  status: "Starting out",
  answers: state.history.map((step) => step.answer),
});
