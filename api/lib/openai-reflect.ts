import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  discoveryPayloadSchema,
  summaryPayloadSchema,
  type DiscoveryPayload,
  type RoundRequest,
  type SummaryPayload,
  type SummaryRequest,
} from "../../shared/ai-contract.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import {
  applySuggestEndingGate,
  createPublicError,
  validateRoundSemantics,
  validateSummarySemantics,
} from "./validate-output.js";

const DEFAULT_MODEL = "gpt-4.1-mini";
const serverEnvironment = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

const getClient = () => {
  const apiKey = serverEnvironment?.OPENAI_API_KEY;
  if (!apiKey) {
    throw createPublicError("AI_UNAVAILABLE", "Live reflection is not configured.", {
      retryable: false,
      fallbackAvailable: true,
    });
  }
  return new OpenAI({ apiKey });
};

const getModel = () => serverEnvironment?.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

export async function generateRound(request: RoundRequest): Promise<DiscoveryPayload> {
  const client = getClient();
  try {
    const response = await client.responses.parse({
      model: getModel(),
      store: false,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(request) },
      ],
      text: { format: zodTextFormat(discoveryPayloadSchema, "hmm_discovery") },
    });

    if (response.status === "incomplete" || !response.output_parsed) {
      const refusal = response.output?.some(
        (item) => item.type === "message" && "refusal" in item && Boolean(item.refusal),
      );
      if (refusal || response.status === "incomplete") {
        throw createPublicError("AI_REFUSAL", "This topic needs a different kind of support.", {
          retryable: false,
          fallbackAvailable: false,
        });
      }
    }

    const parsed = response.output_parsed;
    if (!parsed) {
      throw createPublicError("AI_INVALID_OUTPUT", "The live response could not be understood.", {
        retryable: true,
        fallbackAvailable: true,
      });
    }

    const payload = applySuggestEndingGate(request, discoveryPayloadSchema.parse(parsed));
    const semanticError = validateRoundSemantics(payload);
    if (semanticError) {
      throw createPublicError("AI_INVALID_OUTPUT", semanticError, {
        retryable: true,
        fallbackAvailable: true,
      });
    }
    return payload;
  } catch (error) {
    if (isPublicError(error)) throw error;
    if (isTimeout(error)) {
      throw createPublicError("AI_TIMEOUT", "The live response took too long.", {
        retryable: true,
        fallbackAvailable: true,
      });
    }
    if (isRateLimit(error)) {
      throw createPublicError("AI_RATE_LIMITED", "Live reflection is briefly unavailable.", {
        retryable: true,
        fallbackAvailable: true,
      });
    }
    throw createPublicError("AI_UNAVAILABLE", "Live reflection is unavailable right now.", {
      retryable: true,
      fallbackAvailable: true,
    });
  }
}

export async function generateSummary(request: SummaryRequest): Promise<SummaryPayload> {
  const client = getClient();
  try {
    const response = await client.responses.parse({
      model: getModel(),
      store: false,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(request) },
      ],
      text: { format: zodTextFormat(summaryPayloadSchema, "hmm_summary") },
    });

    if (response.status === "incomplete" || !response.output_parsed) {
      const refusal = response.output?.some(
        (item) => item.type === "message" && "refusal" in item && Boolean(item.refusal),
      );
      if (refusal || response.status === "incomplete") {
        throw createPublicError("AI_REFUSAL", "This topic needs a different kind of support.", {
          retryable: false,
          fallbackAvailable: false,
        });
      }
    }

    const parsed = response.output_parsed;
    if (!parsed) {
      throw createPublicError("AI_INVALID_OUTPUT", "The live summary could not be understood.", {
        retryable: true,
        fallbackAvailable: true,
      });
    }

    const payload = summaryPayloadSchema.parse(parsed);
    const semanticError = validateSummarySemantics(payload);
    if (semanticError) {
      throw createPublicError("AI_INVALID_OUTPUT", semanticError, {
        retryable: true,
        fallbackAvailable: true,
      });
    }
    return payload;
  } catch (error) {
    if (isPublicError(error)) throw error;
    if (isTimeout(error)) {
      throw createPublicError("AI_TIMEOUT", "The live response took too long.", {
        retryable: true,
        fallbackAvailable: true,
      });
    }
    if (isRateLimit(error)) {
      throw createPublicError("AI_RATE_LIMITED", "Live reflection is briefly unavailable.", {
        retryable: true,
        fallbackAvailable: true,
      });
    }
    throw createPublicError("AI_UNAVAILABLE", "Live reflection is unavailable right now.", {
      retryable: true,
      fallbackAvailable: true,
    });
  }
}

function isPublicError(error: unknown): error is ReturnType<typeof createPublicError> {
  return typeof error === "object" && error !== null && "kind" in error && (error as { kind: string }).kind === "error";
}

function isTimeout(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ETIMEDOUT";
}

function isRateLimit(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: number }).status === 429;
}
