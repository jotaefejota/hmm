import type { DiscoveryPayload, RoundRequest, SummaryPayload, SummaryRequest, PublicError } from "../../shared/ai-contract";

export type ContentNotice = {
  code: PublicError["code"] | string;
  message: string;
};

export type ContentResult<T> = {
  data: T;
  source: "live" | "mock";
  notice?: ContentNotice;
};

export interface ReflectionProvider {
  getRound(input: RoundRequest, signal?: AbortSignal): Promise<ContentResult<DiscoveryPayload>>;
  getSummary(input: SummaryRequest, signal?: AbortSignal): Promise<ContentResult<SummaryPayload>>;
}

export class ReflectionProviderError extends Error {
  readonly publicError: PublicError;

  constructor(publicError: PublicError) {
    super(publicError.message);
    this.name = "ReflectionProviderError";
    this.publicError = publicError;
  }
}
