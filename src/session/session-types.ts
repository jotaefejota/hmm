import type { RoundPayload } from "../../shared/ai-contract";

export type ReflectionStep = {
  round: number;
  question: string;
  answer: string;
  answerSource: "suggested" | "custom";
};

export type SessionPhase = "welcome" | "entering" | "generating-round" | "round-ready";

export type SessionState = {
  phase: SessionPhase;
  dilemma: string;
  history: ReflectionStep[];
  currentRound: RoundPayload | null;
  dataSource: "mock" | null;
};

export type SessionEvent =
  | { type: "OPEN_ENTRY" }
  | { type: "CANCEL_ENTRY" }
  | { type: "SUBMIT_DILEMMA"; dilemma: string }
  | { type: "ROUND_LOADED"; round: RoundPayload };

export const initialSessionState: SessionState = {
  phase: "welcome",
  dilemma: "",
  history: [],
  currentRound: null,
  dataSource: null,
};
