import type { RoundPayload, SummaryPayload } from "../../shared/ai-contract";

export type ReflectionStep = {
  round: number;
  question: string;
  answer: string;
  answerSource: "suggested" | "custom";
  choiceIndex: 0 | 1 | 2;
};

export type SessionPhase =
  | "welcome"
  | "entering"
  | "generating-round"
  | "round-ready"
  | "writing-custom-answer"
  | "answer-selected"
  | "transitioning"
  | "clarity-offered"
  | "generating-summary"
  | "ending";

export type SelectedAnswer = {
  text: string;
  source: "suggested" | "custom";
  choiceIndex: 0 | 1 | 2;
};

export type FinishReason = "user" | "suggested" | "max_rounds";

export type SessionState = {
  phase: SessionPhase;
  dilemma: string;
  history: ReflectionStep[];
  currentRound: RoundPayload | null;
  selectedAnswer: SelectedAnswer | null;
  pendingRound: RoundPayload | null;
  transitionFinished: boolean;
  summary: SummaryPayload | null;
  finishReason: FinishReason | null;
  dataSource: "mock" | null;
  activeRequestId: number;
};

export type SessionEvent =
  | { type: "OPEN_ENTRY" }
  | { type: "CANCEL_ENTRY" }
  | { type: "SUBMIT_DILEMMA"; dilemma: string; requestId: number }
  | { type: "ROUND_LOADED"; round: RoundPayload; requestId: number }
  | { type: "OPEN_CUSTOM_ANSWER" }
  | { type: "CLOSE_CUSTOM_ANSWER" }
  | { type: "SELECT_ANSWER"; answer: SelectedAnswer; requestId: number }
  | { type: "NEXT_ROUND_LOADED"; round: RoundPayload; requestId: number }
  | { type: "COMMIT_SELECTION" }
  | { type: "TRANSITION_COMPLETE" }
  | { type: "CONTINUE_AFTER_CLARITY" }
  | { type: "REQUEST_FINISH"; reason: Exclude<FinishReason, "max_rounds">; requestId: number }
  | { type: "SUMMARY_LOADED"; summary: SummaryPayload; requestId: number }
  | { type: "RESTART"; requestId: number };

export const createInitialSessionState = (activeRequestId = 0): SessionState => ({
  phase: "welcome",
  dilemma: "",
  history: [],
  currentRound: null,
  selectedAnswer: null,
  pendingRound: null,
  transitionFinished: false,
  summary: null,
  finishReason: null,
  dataSource: null,
  activeRequestId,
});

export const initialSessionState = createInitialSessionState();
