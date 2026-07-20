import type { DiscoveryPayload, RoundRequest, SummaryPayload, SummaryRequest } from "../../shared/ai-contract";
import { MockReflectionProvider } from "./mock-provider";
import { LiveReflectionProvider } from "./live-provider";
import type { ContentResult, ReflectionProvider } from "./reflection-provider";
import { ReflectionProviderError } from "./reflection-provider";

export type ContentMode = "auto" | "mock" | "live";

export class ResilientReflectionProvider implements ReflectionProvider {
  private readonly mock = new MockReflectionProvider();
  private readonly live = new LiveReflectionProvider();

  constructor(private readonly mode: ContentMode) {}

  async getRound(input: RoundRequest, signal?: AbortSignal): Promise<ContentResult<DiscoveryPayload>> {
    if (this.mode === "mock") return this.mock.getRound(input, signal);
    if (this.mode === "live") return this.live.getRound(input, signal);
    try {
      return await this.live.getRound(input, signal);
    } catch (error) {
      if (error instanceof ReflectionProviderError && !error.publicError.fallbackAvailable) throw error;
      const fallback = await this.mock.getRound(input, signal);
      return {
        ...fallback,
        notice: {
          code: error instanceof ReflectionProviderError ? error.publicError.code : "AI_UNAVAILABLE",
          message: "Using prepared reflection while live generation recovers.",
        },
      };
    }
  }

  async getSummary(input: SummaryRequest, signal?: AbortSignal): Promise<ContentResult<SummaryPayload>> {
    if (this.mode === "mock") return this.mock.getSummary(input, signal);
    if (this.mode === "live") return this.live.getSummary(input, signal);
    try {
      return await this.live.getSummary(input, signal);
    } catch (error) {
      if (error instanceof ReflectionProviderError && !error.publicError.fallbackAvailable) throw error;
      const fallback = await this.mock.getSummary(input, signal);
      return {
        ...fallback,
        notice: {
          code: error instanceof ReflectionProviderError ? error.publicError.code : "AI_UNAVAILABLE",
          message: "Using prepared reflection while live generation recovers.",
        },
      };
    }
  }
}

export function resolveContentMode(raw = import.meta.env.VITE_CONTENT_MODE): ContentMode {
  if (raw === "live" || raw === "auto" || raw === "mock") return raw;
  return "mock";
}

export function createReflectionProvider(mode = resolveContentMode()): ReflectionProvider {
  if (mode === "mock") return new MockReflectionProvider();
  return new ResilientReflectionProvider(mode);
}

export const reflectionProvider = createReflectionProvider();
