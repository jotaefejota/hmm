import {
  publicErrorSchema,
  roundPayloadSchema,
  summaryPayloadSchema,
  type RoundPayload,
  type RoundRequest,
  type SummaryPayload,
  type SummaryRequest,
} from "../../shared/ai-contract";
import type { ContentResult, ReflectionProvider } from "./reflection-provider";
import { ReflectionProviderError } from "./reflection-provider";

const LIVE_TIMEOUT_MS = 7_000;

export class LiveReflectionProvider implements ReflectionProvider {
  async getRound(input: RoundRequest, signal?: AbortSignal): Promise<ContentResult<RoundPayload>> {
    return {
      source: "live",
      data: await this.post(input, roundPayloadSchema, signal),
    };
  }

  async getSummary(input: SummaryRequest, signal?: AbortSignal): Promise<ContentResult<SummaryPayload>> {
    return {
      source: "live",
      data: await this.post(input, summaryPayloadSchema, signal),
    };
  }

  private async post<T>(
    input: RoundRequest | SummaryRequest,
    schema: { parse: (value: unknown) => T },
    outerSignal?: AbortSignal,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
    const onAbort = () => controller.abort();
    outerSignal?.addEventListener("abort", onAbort);

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      const json: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const parsedError = publicErrorSchema.safeParse(json);
        if (parsedError.success) throw new ReflectionProviderError(parsedError.data);
        throw new ReflectionProviderError({
          kind: "error",
          code: "AI_UNAVAILABLE",
          message: "Live reflection is unavailable right now.",
          retryable: true,
          fallbackAvailable: true,
        });
      }

      return schema.parse(json);
    } catch (error) {
      if (error instanceof ReflectionProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        if (outerSignal?.aborted) throw error;
        throw new ReflectionProviderError({
          kind: "error",
          code: "AI_TIMEOUT",
          message: "The live response took too long.",
          retryable: true,
          fallbackAvailable: true,
        });
      }
      throw new ReflectionProviderError({
        kind: "error",
        code: "AI_UNAVAILABLE",
        message: "Live reflection is unavailable right now.",
        retryable: true,
        fallbackAvailable: true,
      });
    } finally {
      window.clearTimeout(timeout);
      outerSignal?.removeEventListener("abort", onAbort);
    }
  }
}
