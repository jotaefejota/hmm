import type { DiscoveryPayload, RoundRequest, SummaryPayload } from "../../shared/ai-contract.js";
import { publicErrorSchema, type PublicError } from "../../shared/ai-contract.js";

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

export function applySuggestEndingGate(request: RoundRequest, payload: DiscoveryPayload): DiscoveryPayload {
  const maySuggest =
    request.requestMode === "core" &&
    request.roundNumber === 5 &&
    request.history.length === 4;
  if (maySuggest) return payload;
  return { ...payload, suggestEnding: false };
}

export function validateRoundSemantics(payload: DiscoveryPayload): string | null {
  if (payload.lenses.some((lens) => !lens.question.endsWith("?") || MULTI_QUESTION.test(lens.question))) {
    return "Question must end in exactly one question mark.";
  }
  if (payload.lenses.some((lens) => /\n/.test(lens.theme) || /\n/.test(lens.question) || lens.answers.some((answer) => /\n/.test(answer))) || /\n/.test(payload.fortune) || /\n/.test(payload.transition)) {
    return "Round strings must be single-line.";
  }
  const authorityTarget = [...payload.lenses.flatMap((lens) => [lens.theme, lens.question, ...lens.answers]), payload.fortune, payload.transition].join(" ");
  if (AUTHORITY_PATTERN.test(authorityTarget)) {
    return "Round content contains banned authority language.";
  }
  const normalizedFortune = payload.fortune.toLocaleLowerCase();
  if (payload.lenses.some((lens) => normalizedFortune === lens.theme.toLocaleLowerCase() || normalizedFortune === lens.question.toLocaleLowerCase())) {
    return "Fortune must add a distinct reframing.";
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
