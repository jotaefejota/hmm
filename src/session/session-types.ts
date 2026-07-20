import type { DiscoveryPayload, SummaryPayload } from "../../shared/ai-contract";
import type { PublicError } from "../../shared/ai-contract";

export type ReflectionStep = {
  round: number;
  lensTheme: string;
  lensIndex: 0 | 1;
  question: string;
  answer: string;
  answerSource: "suggested" | "custom";
  choiceIndex: 0 | 1 | 2;
  /** Original lens answers, retained only for revising an unfolded decision. */
  options?: readonly string[];
};

export type SessionPhase =
  | "welcome"
  | "entering"
  | "generating-round"
  | "lens-ready"
  | "round-ready"
  | "writing-custom-answer"
  | "answer-selected"
  | "transitioning"
  | "finish-offered"
  | "generating-summary"
  | "ending"
  | "error";

export type SelectedAnswer = {
  text: string;
  source: "suggested" | "custom";
  choiceIndex: 0 | 1 | 2;
};

export type FinishReason = "user" | "suggested" | "max_rounds" | "extension";
export type RecoverablePhase = Extract<
  SessionPhase,
  "generating-round" | "answer-selected" | "transitioning" | "generating-summary"
>;

export type SessionState = {
  phase: SessionPhase;
  dilemma: string;
  history: ReflectionStep[];
  currentDiscovery: DiscoveryPayload | null;
  selectedLensIndex: 0 | 1 | null;
  selectedAnswer: SelectedAnswer | null;
  pendingDiscovery: DiscoveryPayload | null;
  transitionFinished: boolean;
  summary: SummaryPayload | null;
  finishReason: FinishReason | null;
  extensionUsed: boolean;
  extensionFocus: string | null;
  dataSource: "mock" | null;
  requestError: PublicError | null;
  errorPhase: RecoverablePhase | null;
  activeRequestId: number;
};

export type SessionEvent =
  | { type: "OPEN_ENTRY" }
  | { type: "CANCEL_ENTRY" }
  | { type: "SUBMIT_DILEMMA"; dilemma: string; requestId: number }
  | { type: "DISCOVERY_LOADED"; discovery: DiscoveryPayload; requestId: number }
  | { type: "OPEN_LENS"; lensIndex: 0 | 1 }
  | { type: "RETURN_TO_LENSES" }
  | { type: "OPEN_CUSTOM_ANSWER" }
  | { type: "CLOSE_CUSTOM_ANSWER" }
  | { type: "SELECT_ANSWER"; answer: SelectedAnswer; requestId: number }
  | { type: "REVISE_HISTORY_SELECTION"; stepIndex: number; answer: SelectedAnswer; requestId: number }
  | { type: "NEXT_DISCOVERY_LOADED"; discovery: DiscoveryPayload; requestId: number }
  | { type: "COMMIT_SELECTION" }
  | { type: "TRANSITION_COMPLETE" }
  | { type: "CONTINUE_FROM_FINISH" }
  | { type: "DISMISS_SUMMARY" }
  | { type: "REQUEST_FINISH"; reason: Exclude<FinishReason, "max_rounds" | "extension">; requestId: number }
  | { type: "REQUEST_EXTENSION"; focus: string; requestId: number }
  | { type: "SUMMARY_LOADED"; summary: SummaryPayload; requestId: number }
  | { type: "REQUEST_FAILED"; error: PublicError; requestId: number }
  | { type: "RECOVER_REQUEST"; requestId: number }
  | { type: "RESTART"; requestId: number };

export const createInitialSessionState = (activeRequestId = 0): SessionState => ({
  phase: "welcome",
  dilemma: "",
  history: [],
  currentDiscovery: null,
  selectedLensIndex: null,
  selectedAnswer: null,
  pendingDiscovery: null,
  transitionFinished: false,
  summary: null,
  finishReason: null,
  extensionUsed: false,
  extensionFocus: null,
  dataSource: null,
  requestError: null,
  errorPhase: null,
  activeRequestId,
});

export const initialSessionState = createInitialSessionState();
