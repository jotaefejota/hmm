import type { RoundPayload, RoundRequest, SummaryPayload } from "../../shared/ai-contract";
import { publicErrorSchema, type PublicError } from "../../shared/ai-contract";

const AUTHORITY_PATTERN = /\byou should\b|\byou need to\b|\bthe best choice\b|\d+\s*%/i;
const MULTI_QUESTION = /\?[\s\S]*\?/;

export function createPublicError(
  code: PublicError["code"],
  message: string,
  options: { retryable: boolean; fallbackAvailable: boolean },
): PublicError {
  return publicErrorSchema.parse({
    kind: "error",
    code,
    message,
    retryable: options.retryable,
    fallbackAvailable: options.fallbackAvailable,
  });
}

export function applySuggestEndingGate(request: RoundRequest, payload: RoundPayload): RoundPayload {
  const maySuggest =
    request.requestMode === "core" &&
    request.roundNumber === 5 &&
    request.history.length === 4;
  if (maySuggest) return payload;
  return { ...payload, suggestEnding: false };
}

export function validateRoundSemantics(payload: RoundPayload): string | null {
  if (!payload.question.endsWith("?") || MULTI_QUESTION.test(payload.question)) {
    return "Question must end in exactly one question mark.";
  }
  if (/\n/.test(payload.question) || payload.answers.some((answer) => /\n/.test(answer)) || /\n/.test(payload.transition)) {
    return "Round strings must be single-line.";
  }
  const authorityTarget = [payload.question, ...payload.answers, payload.transition].join(" ");
  if (AUTHORITY_PATTERN.test(authorityTarget)) {
    return "Round content contains banned authority language.";
  }
  return null;
}

export function validateSummarySemantics(payload: SummaryPayload): string | null {
  if (!/^(You seem|You appear|A direction taking shape is)/i.test(payload.direction)) {
    // Soft check: still allow other tentative phrasings that Zod already length-limits.
    if (AUTHORITY_PATTERN.test(payload.direction) || /\byou must\b/i.test(payload.direction)) {
      return "Summary direction must stay tentative.";
    }
  }
  if (AUTHORITY_PATTERN.test([payload.direction, payload.nextStep, ...payload.reasons, ...payload.doubts].join(" "))) {
    return "Summary content contains banned authority language.";
  }
  return null;
}
