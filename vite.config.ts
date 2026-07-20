import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv, type Plugin } from "vite";
import type { ServerResponse } from "node:http";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function localReflectApi(): Plugin {
  return {
    name: "local-reflect-api",
    configureServer(server) {
      server.middlewares.use("/api/reflect", async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule("/api/reflect.ts");
          const fakeRes = createFakeResponse(res);
          await handler(req as VercelRequest, fakeRes);
        } catch {
          if (res.headersSent) return;
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            kind: "error",
            code: "AI_UNAVAILABLE",
            message: "Local reflection is unavailable right now.",
            retryable: true,
            fallbackAvailable: true,
          }));
        }
      });
    },
  };
}

function createFakeResponse(res: ServerResponse): VercelResponse {
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
  } as VercelResponse;
}

export default defineConfig(({ mode }) => {
  const fullStack = process.env.HMM_ENABLE_LOCAL_API === "1";
  if (fullStack) {
    const serverEnv = loadEnv(mode, process.cwd(), "");
    process.env.OPENAI_API_KEY = serverEnv.OPENAI_API_KEY;
    process.env.OPENAI_MODEL = serverEnv.OPENAI_MODEL;
  }

  return {
    plugins: [react(), ...(fullStack ? [localReflectApi()] : [])],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
    },
  };
});
