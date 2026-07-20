import type {
  RoundPayload,
  RoundRequest,
  SummaryPayload,
  SummaryRequest,
} from "../../shared/ai-contract";

export interface ReflectionProvider {
  getRound(input: RoundRequest, signal?: AbortSignal): Promise<RoundPayload>;
  getSummary(input: SummaryRequest, signal?: AbortSignal): Promise<SummaryPayload>;
}

