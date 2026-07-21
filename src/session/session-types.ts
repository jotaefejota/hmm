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

export type OpenedFortune = {
  round: number;
  text: string;
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
  /** A historical revision at the fourth-round pause must resume the new route before offering another pause. */
  skipNextFinishOffer: boolean;
  summary: SummaryPayload | null;
  finishReason: FinishReason | null;
  extensionUsed: boolean;
  dataSource: "mock" | null;
  requestError: PublicError | null;
  errorPhase: RecoverablePhase | null;
  activeRequestId: number;
  /** A per-session seed keeps surprise-cookie timing random but stable on rerender. */
  fortuneSeed: number;
  /** Contextual angles the user explicitly opened; shown in the final reflection only. */
  openedFortunes: OpenedFortune[];
};

export type SessionEvent =
  | { type: "SUBMIT_DILEMMA"; dilemma: string; requestId: number; fortuneSeed?: number }
  | { type: "DISCOVERY_LOADED"; discovery: DiscoveryPayload; requestId: number }
  | { type: "OPEN_LENS"; lensIndex: 0 | 1 }
  | { type: "OPEN_FORTUNE"; fortune: OpenedFortune }
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
  | { type: "REQUEST_EXTENSION"; requestId: number }
  | { type: "SUMMARY_LOADED"; summary: SummaryPayload; requestId: number }
  | { type: "REQUEST_FAILED"; error: PublicError; requestId: number }
  | { type: "RECOVER_REQUEST"; requestId: number }
  | { type: "RETURN_TO_LANDING"; requestId: number }
  | { type: "RESTART"; requestId: number };

export const createInitialSessionState = (activeRequestId = 0): SessionState => ({
  phase: "entering",
  dilemma: "",
  history: [],
  currentDiscovery: null,
  selectedLensIndex: null,
  selectedAnswer: null,
  pendingDiscovery: null,
  transitionFinished: false,
  skipNextFinishOffer: false,
  summary: null,
  finishReason: null,
  extensionUsed: false,
  dataSource: null,
  requestError: null,
  errorPhase: null,
  activeRequestId,
  fortuneSeed: 0,
  openedFortunes: [],
});

export const initialSessionState = createInitialSessionState();
