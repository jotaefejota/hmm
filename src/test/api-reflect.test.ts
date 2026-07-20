import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicError } from "../../shared/ai-contract";

const generators = vi.hoisted(() => ({
  round: vi.fn(),
  summary: vi.fn(),
}));

vi.mock("../../api/lib/openai-reflect", () => ({
  generateRound: generators.round,
  generateSummary: generators.summary,
}));

import handler from "../../api/reflect";

const roundRequest = {
  contractVersion: "1",
  kind: "round",
  dilemma: "Should I take the role?",
  roundNumber: 1,
  requestMode: "core",
  maxCoreRounds: 5,
  history: [],
  focus: null,
} as const;

const summaryRequest = {
  contractVersion: "1",
  kind: "summary",
  dilemma: "Should I take the role?",
  history: [
    { round: 1, question: "What matters most?", answer: "Creative work", answerSource: "suggested" },
    { round: 2, question: "What might change?", answer: "My schedule", answerSource: "suggested" },
  ],
  finishReason: "user",
} as const;

const roundPayload = {
  kind: "round",
  question: "What matters most right now?",
  answers: ["Creative work", "More influence", "Time to decide"],
  transition: "Let’s stay with what has weight.",
  suggestEnding: false,
} as const;

const summaryPayload = {
  kind: "summary",
  direction: "You seem open to the role if creative work remains protected.",
  reasons: ["Creative work matters.", "You also want more influence."],
  doubts: ["The weekly schedule is still unclear."],
  nextStep: "Ask how much creative time the role protects.",
} as const;

type CapturedResponse = {
  statusCode: number;
  headers: Map<string, string>;
  body: unknown;
};

function createResponse(): { response: VercelResponse; captured: CapturedResponse } {
  const captured: CapturedResponse = { statusCode: 200, headers: new Map(), body: null };
  const response = {
    setHeader(name: string, value: string) {
      captured.headers.set(name, value);
      return response;
    },
    status(code: number) {
      captured.statusCode = code;
      return response;
    },
    json(body: unknown) {
      captured.body = body;
      return response;
    },
  } as unknown as VercelResponse;
  return { response, captured };
}

async function invoke(method: string, body?: unknown) {
  const { response, captured } = createResponse();
  await handler({ method, body } as VercelRequest, response);
  return captured;
}

const publicError = (
  code: PublicError["code"],
  retryable: boolean,
  fallbackAvailable: boolean,
): PublicError => ({
  kind: "error",
  code,
  message: "Public boundary message.",
  retryable,
  fallbackAvailable,
});

describe("POST /api/reflect", () => {
  beforeEach(() => {
    generators.round.mockReset();
    generators.summary.mockReset();
  });

  it("returns a validated round without caching", async () => {
    generators.round.mockResolvedValue(roundPayload);
    const result = await invoke("POST", roundRequest);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(roundPayload);
    expect(result.headers.get("Cache-Control")).toBe("no-store");
    expect(generators.round).toHaveBeenCalledWith(roundRequest);
  });

  it("returns a validated summary", async () => {
    generators.summary.mockResolvedValue(summaryPayload);
    const result = await invoke("POST", summaryRequest);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(summaryPayload);
    expect(generators.summary).toHaveBeenCalledWith(summaryRequest);
  });

  it("rejects methods other than POST", async () => {
    const result = await invoke("GET");
    expect(result.statusCode).toBe(405);
    expect(result.body).toMatchObject({ code: "BAD_REQUEST", fallbackAvailable: false });
  });

  it("rejects invalid input without calling the model", async () => {
    const result = await invoke("POST", { kind: "round" });
    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({ code: "BAD_REQUEST", fallbackAvailable: false });
    expect(generators.round).not.toHaveBeenCalled();
  });

  it.each([
    ["AI_TIMEOUT", 503, true, true],
    ["AI_REFUSAL", 422, false, false],
    ["AI_INVALID_OUTPUT", 503, true, true],
  ] as const)("maps %s to its public response", async (code, status, retryable, fallbackAvailable) => {
    generators.round.mockRejectedValue(publicError(code, retryable, fallbackAvailable));
    const result = await invoke("POST", roundRequest);

    expect(result.statusCode).toBe(status);
    expect(result.body).toEqual(publicError(code, retryable, fallbackAvailable));
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  });
});
