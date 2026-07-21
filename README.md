# Hmm…

Hmm… is a curious companion for thinking through a bounded decision. It offers two question lenses, opens the chosen one into exactly three possible responses, and leaves the selected path visible without deciding for the user.

**Live 0.1 demo:** [hmm-mu-rust.vercel.app](https://hmm-mu-rust.vercel.app/). The `dev` branch contains the contract-v2 discovery-lens experience described below and requires a new deployment before it appears at that URL.

## What is implemented

- a complete four-to-five-round reflection session;
- one persistent cellular field whose camera follows choice-dependent routes;
- a stable **Progress** card containing the original dilemma and committed answers;
- two question lenses per round, direct trail-bubble review, and contextual fortune-cookie reframes;
- early finishing, a structured summary, direct continuation into more Hmm… lenses, and restart;
- deterministic mock content, live OpenAI generation, and automatic fallback;
- a local, deterministic **Continue in ChatGPT** handoff;
- recoverable timeout and refusal states that preserve session context.

Sessions live only in browser memory. There is no login, database, analytics layer, or saved history.

## Run locally

Requirements: a current Node.js release and npm.

```bash
npm install
VITE_CONTENT_MODE=mock npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Forced mock mode completes the curated camera journey without a network request or API key.

### Run with live generation

Copy `.env.example` to `.env.local`, then add the server-only values:

```dotenv
VITE_CONTENT_MODE=auto
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Do not put the key in `.env.example`, a `VITE_` variable, or any file under `src/`.

```bash
npm run dev:full
```

`dev:full` starts Vite and mounts the same `/api/reflect` handler used by Vercel. Content modes are:

- `mock`: validated fixtures only; never calls the endpoint;
- `auto`: tries live generation, then safely falls back to prepared content;
- `live`: surfaces a recoverable error instead of silently falling back.

## Demo path

1. Start with the prefilled camera dilemma and select **Hmm…**.
3. Choose one of the three bubbles in each of four rounds; different positions create different routes.
4. Select **Something is taking shape** and then **Discover**.
5. Show the direction, reasons, remaining doubts, and next step.
6. Demonstrate **Continue in ChatGPT** or **Start again**.

If clipboard access is blocked, the handoff reveals the complete prepared prompt for manual copying.

## Commands

```bash
npm run dev         # client only
npm run dev:full    # client plus local /api/reflect
npm test
npm run test:watch
npm run lint
npm run typecheck
npm run build
npm run preview
npm run check       # lint + types + tests + production build
```

## Test recovery states

Development builds support deterministic error checks:

- `http://127.0.0.1:5173/?simulateError=timeout` preserves the current path and offers retry or prepared content;
- `http://127.0.0.1:5173/?simulateError=refusal` preserves the current path and offers restart only.

These parameters are deliberately ignored by production builds.

## Deployment

The app is deployed as one Vercel project: Vite serves the client and `api/reflect.ts` runs as a serverless function. Configure these environment variables in Vercel:

- `OPENAI_API_KEY` — encrypted, server-side only;
- `OPENAI_MODEL` — currently `gpt-4.1-mini`;
- `VITE_CONTENT_MODE` — `auto` for the live demo or `mock` for a deterministic deployment.

Production has been smoke-tested through two consecutive live rounds. The complete API-free journey remains the reliable presentation path.

## Project map

- `api/`: secret-bearing serverless endpoint;
- `shared/`: Zod request and response contracts shared by client and server;
- `src/session/`: reducer, events, and selectors;
- `src/layout/`: deterministic cell field, route, and camera projection;
- `src/services/`: mock, live, and resilient providers;
- `src/content/`: validated demo fixtures;
- `src/components/` and `src/styles/`: experience and visual presentation;
- `docs/`: product, experience, technical, AI, and build decisions.

Start with [`docs/01-product-and-mvp.md`](docs/01-product-and-mvp.md), then follow the numbered documents. Contributor rules and the definition of done live in [`AGENTS.md`](AGENTS.md).
