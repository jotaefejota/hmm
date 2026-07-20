import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  publicErrorSchema,
  roundPayloadSchema,
  roundRequestSchema,
  summaryPayloadSchema,
  summaryRequestSchema,
  type PublicError,
} from "../shared/ai-contract.js";
import { generateRound, generateSummary } from "./lib/openai-reflect.js";
import { createPublicError } from "./lib/validate-output.js";

const MAX_BODY_BYTES = 24_576;

const setNoStore = (res: VercelResponse) => {
  res.setHeader("Cache-Control", "no-store");
};

const readJsonBody = async (req: VercelRequest): Promise<unknown> => {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object") {
    return req.body;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw createPublicError("BAD_REQUEST", "Request body is too large.", {
        retryable: false,
        fallbackAvailable: false,
      });
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    throw createPublicError("BAD_REQUEST", "Request body is required.", {
      retryable: false,
      fallbackAvailable: false,
    });
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw createPublicError("BAD_REQUEST", "Request body must be JSON.", {
      retryable: false,
      fallbackAvailable: false,
    });
  }
};

const sendError = (res: VercelResponse, error: PublicError, status = 400) => {
  setNoStore(res);
  res.status(status).json(publicErrorSchema.parse(error));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setNoStore(res);

  if (req.method !== "POST") {
    sendError(
      res,
      createPublicError("BAD_REQUEST", "Only POST is accepted.", {
        retryable: false,
        fallbackAvailable: false,
      }),
      405,
    );
    return;
  }

  try {
    const body = await readJsonBody(req);
    if (!body || typeof body !== "object" || !("kind" in body)) {
      throw createPublicError("BAD_REQUEST", "Unknown reflection request.", {
        retryable: false,
        fallbackAvailable: false,
      });
    }

    if ((body as { kind: string }).kind === "round") {
      const request = roundRequestSchema.parse(body);
      const payload = roundPayloadSchema.parse(await generateRound(request));
      setNoStore(res);
      res.status(200).json(payload);
      return;
    }

    if ((body as { kind: string }).kind === "summary") {
      const request = summaryRequestSchema.parse(body);
      const payload = summaryPayloadSchema.parse(await generateSummary(request));
      setNoStore(res);
      res.status(200).json(payload);
      return;
    }

    throw createPublicError("BAD_REQUEST", "Unknown reflection request.", {
      retryable: false,
      fallbackAvailable: false,
    });
  } catch (error) {
    if (isZodError(error)) {
      sendError(
        res,
        createPublicError("BAD_REQUEST", "Request failed validation.", {
          retryable: false,
          fallbackAvailable: false,
        }),
      );
      return;
    }
    if (isPublicError(error)) {
      const status = error.code === "AI_REFUSAL" ? 422 : error.code === "BAD_REQUEST" ? 400 : 503;
      sendError(res, error, status);
      return;
    }
    sendError(
      res,
      createPublicError("AI_UNAVAILABLE", "Live reflection is unavailable right now.", {
        retryable: true,
        fallbackAvailable: true,
      }),
      503,
    );
  }
}

function isPublicError(error: unknown): error is PublicError {
  return typeof error === "object" && error !== null && "kind" in error && (error as { kind: string }).kind === "error";
}

function isZodError(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && (error as { name: string }).name === "ZodError";
}
