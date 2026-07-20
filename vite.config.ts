import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

function localReflectApi(): Plugin {
  return {
    name: "local-reflect-api",
    configureServer(server) {
      server.middlewares.use("/api/reflect", async (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }
        try {
          const body = await readBody(req);
          const { default: handler } = await server.ssrLoadModule("/api/reflect.ts");
          const fakeReq = {
            method: "POST",
            body: JSON.parse(body || "{}"),
            headers: req.headers,
          };
          const fakeRes = createFakeResponse(res);
          await handler(fakeReq, fakeRes);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            kind: "error",
            code: "AI_UNAVAILABLE",
            message: error instanceof Error ? error.message : "Local API failed.",
            retryable: true,
            fallbackAvailable: true,
          }));
        }
      });
    },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function createFakeResponse(res: ServerResponse) {
  const headers = new Map<string, string>();
  return {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers.set(name, value);
      res.setHeader(name, value);
    },
    status(code: number) {
      this.statusCode = code;
      res.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      if (!headers.has("Content-Type")) res.setHeader("Content-Type", "application/json");
      res.statusCode = this.statusCode;
      res.end(JSON.stringify(payload));
    },
  };
}

export default defineConfig({
  plugins: [react(), localReflectApi()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
