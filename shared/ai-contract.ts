import { z } from "zod";
import {
  CUSTOM_ANSWER_MAX_LENGTH,
  DILEMMA_MAX_LENGTH,
  MAX_CORE_ROUNDS,
  QUESTION_MAX_LENGTH,
  SUGGESTED_ANSWER_MAX_LENGTH,
} from "./limits";

const trimmedString = (max: number) => z.string().trim().min(1).max(max);

export const answerSourceSchema = z.enum(["suggested", "custom"]);

export const historyItemSchema = z.object({
  round: z.number().int().min(1).max(6),
  question: trimmedString(QUESTION_MAX_LENGTH),
  answer: trimmedString(CUSTOM_ANSWER_MAX_LENGTH),
  answerSource: answerSourceSchema,
}).strict().superRefine((item, context) => {
  if (item.answerSource === "suggested" && item.answer.length > SUGGESTED_ANSWER_MAX_LENGTH) {
    context.addIssue({ code: "custom", path: ["answer"], message: "Suggested answers must be at most 40 characters." });
  }
});

const baseRequestSchema = z.object({
  contractVersion: z.literal("1"),
  dilemma: trimmedString(DILEMMA_MAX_LENGTH),
});

export const roundRequestSchema = baseRequestSchema.extend({
  kind: z.literal("round"),
  roundNumber: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  requestMode: z.enum(["core", "extension"]),
  maxCoreRounds: z.literal(MAX_CORE_ROUNDS),
  history: z.array(historyItemSchema).max(MAX_CORE_ROUNDS),
  focus: trimmedString(140).nullable(),
}).strict().superRefine((request, context) => {
  const isContiguous = request.history.every((item, index) => item.round === index + 1);
  if (!isContiguous) context.addIssue({ code: "custom", path: ["history"], message: "History rounds must be contiguous." });
  if (request.requestMode === "core") {
    if (request.focus !== null) context.addIssue({ code: "custom", path: ["focus"], message: "Core requests cannot include a focus." });
    if (request.roundNumber !== request.history.length + 1 || request.roundNumber > MAX_CORE_ROUNDS) {
      context.addIssue({ code: "custom", path: ["roundNumber"], message: "Core round number must follow history." });
    }
  }
});

export const summaryRequestSchema = baseRequestSchema.extend({
  kind: z.literal("summary"),
  history: z.array(historyItemSchema).min(2).max(6),
  finishReason: z.enum(["user", "suggested", "max_rounds", "extension"]),
}).strict();

const answerSchema = trimmedString(SUGGESTED_ANSWER_MAX_LENGTH);

export const roundPayloadSchema = z.object({
  kind: z.literal("round"),
  question: trimmedString(QUESTION_MAX_LENGTH),
  answers: z.array(answerSchema).length(3).superRefine((answers, context) => {
    if (new Set(answers.map((answer) => answer.toLocaleLowerCase())).size !== 3) {
      context.addIssue({ code: "custom", message: "Answers must be distinct." });
    }
  }),
  transition: trimmedString(80),
  suggestEnding: z.boolean(),
}).strict();

const uniqueStrings = (items: string[], context: z.RefinementCtx) => {
  if (new Set(items.map((item) => item.toLocaleLowerCase())).size !== items.length) {
    context.addIssue({ code: "custom", message: "Items must be distinct." });
  }
};

export const summaryPayloadSchema = z.object({
  kind: z.literal("summary"),
  direction: trimmedString(240),
  reasons: z.array(trimmedString(120)).min(2).max(3).superRefine(uniqueStrings),
  doubts: z.array(trimmedString(140)).min(1).max(2).superRefine(uniqueStrings),
  nextStep: trimmedString(180),
}).strict();

export const publicErrorSchema = z.object({
  kind: z.literal("error"),
  code: z.enum([
    "AI_UNAVAILABLE",
    "AI_TIMEOUT",
    "AI_RATE_LIMITED",
    "AI_INVALID_OUTPUT",
    "AI_REFUSAL",
    "BAD_REQUEST",
  ]),
  message: trimmedString(120),
  retryable: z.boolean(),
  fallbackAvailable: z.boolean(),
}).strict();

export type HistoryItem = z.infer<typeof historyItemSchema>;
export type RoundRequest = z.infer<typeof roundRequestSchema>;
export type SummaryRequest = z.infer<typeof summaryRequestSchema>;
export type RoundPayload = z.infer<typeof roundPayloadSchema>;
export type SummaryPayload = z.infer<typeof summaryPayloadSchema>;
export type PublicError = z.infer<typeof publicErrorSchema>;
