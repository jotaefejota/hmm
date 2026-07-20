# Hmm…

Hmm… is a visual companion for thinking through a decision. It does not predict outcomes or decide for the user. It asks a useful question, offers exactly three possible directions, and lets the user follow a short path until a clearer direction begins to emerge.

The experience is inspired by rubber duck debugging: explaining a dilemma and reacting to focused questions helps people discover what they already think.

## What the app does

A session begins with a question or dilemma. Hmm… then:

1. asks one concise reflective question;
2. presents exactly three suggested answers, plus a separate option to write a different answer;
3. turns the selected answer into the next segment of a visible path;
4. keeps the original dilemma and committed choices in **Your thread**;
5. offers an ending after enough reflection or when the user selects **I think I’ve got it**;
6. summarizes the emerging direction, reasons, remaining doubts, and one concrete next step.

From the result, the user can explore one remaining doubt, restart, or copy a prepared context prompt and continue in ChatGPT.

## The visual model

The main interface is a persistent cellular field larger than the viewport. Questions, possibilities, and selected answers occupy stable cells rather than creating a new cluster every round.

- Violet represents questions from Hmm…
- Amber represents the user’s dilemma and committed choices.
- Quiet neutral cells form the surrounding field.
- Upper, middle, and lower choices bend the next path segment differently.
- The camera follows the active question as the route moves away from its origin.
- Previous choices remain marked in the world and listed in **Your thread**.

Positioning and movement are deterministic. There is no physics engine, random layout, free pan or zoom, or attempt to fit the complete route back into one viewport. Narrow windows use a readable vertical thread instead of a scaled-down graph.

## Current state

The hackathon prototype currently includes:

- a complete API-free demonstration journey;
- custom answers without introducing a fourth suggested option;
- guarded selection and transition logic for rapid or repeated clicks;
- a persistent, choice-dependent visual trail;
- progress review by selecting committed answers in **Your thread**;
- early, suggested, and maximum-round endings;
- a final result with one optional extension round;
- restart and ChatGPT handoff flows;
- mock, live, and automatic-fallback content providers;
- a protected Vercel Function for OpenAI requests;
- responsive, keyboard, focus, and reduced-motion foundations.

The deterministic mock session is the recommended mode for demonstrations.

## Technology

- React and TypeScript
- Vite
- Plain CSS with custom properties
- Motion for React
- React `useReducer` for canonical session state
- SVG for connections over accessible HTML controls
- Zod for shared browser/server contracts
- Vitest and Testing Library
- One TypeScript Vercel Function for live OpenAI generation

The prototype intentionally has no login, database, collaboration layer, graph library, or physics engine.

## Run the mock demo

Requirements: a current Node.js LTS release and npm.

```bash
npm install
VITE_CONTENT_MODE=mock npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

Mock mode makes no AI request and can complete the entire curated team-lead scenario without network access.

## Recommended demo path

1. Select **Start with a thought**.
2. Keep the prefilled dilemma: “Should I accept a team-lead role if it means less hands-on creative work?”
3. Select **Think it through**.
4. Choose the first possibility through four rounds.
5. Select **See what’s emerging** when clarity is offered.
6. Review the direction, reasons, doubts, and next step.
7. Demonstrate **Continue in ChatGPT**, **Explore one remaining doubt**, or **Start over**.

The intended presentation fits comfortably inside 90 seconds and does not depend on the live API.

## Content modes

Set `VITE_CONTENT_MODE` before starting the client:

| Mode | Behaviour |
| --- | --- |
| `mock` | Always uses validated local fixtures and makes no API request. |
| `live` | Uses `/api/reflect` and surfaces failures without mock substitution. |
| `auto` | Attempts the live endpoint, then quietly falls back to mock content for recoverable failures. |

An unknown or missing value currently resolves to `mock`.

## Live generation

Live requests are handled by `POST /api/reflect`. The function validates incoming data, calls OpenAI using Structured Outputs, validates the result again, and returns only the public contract. Responses use `Cache-Control: no-store`.

Server environment variables:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

Client configuration:

```bash
VITE_CONTENT_MODE=auto
```

Deploying through Vercel supplies the serverless runtime used by `/api/reflect`. At present, `npm run dev` and `npm run dev:full` both start plain Vite; they do not emulate the Vercel Function locally. Use forced mock mode for ordinary local development until the full local serverless command is wired.

Never expose `OPENAI_API_KEY` through a `VITE_` variable, client source, browser storage, or browser-visible payload.

## Commands

```bash
npm run dev          # Start the Vite client
npm run dev:full     # Currently starts the same Vite client
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript
npm run build        # Create the production client build
npm run preview      # Preview the production build
npm run check        # Lint, type-check, test, and build
```

Run `npm run check` before declaring development work complete.

## Repository structure

```text
api/                  Vercel Function and server-only OpenAI integration
shared/               Zod contracts and limits shared by client and server
src/app/              Application orchestration
src/components/       Session, canvas, and ending presentation
src/content/          Validated mock journey
src/layout/           Deterministic lattice, occupancy, routes, and curves
src/services/         Mock, live, and resilient content providers
src/session/          Session state, reducer, selectors, and review focus
src/styles/           Visual tokens, layout, canvas, and motion
docs/                 Product, experience, technical, AI, and build plans
references/           Early visual references
```

Session meaning is kept separate from presentation and content generation. The reducer stores the dilemma, current round, history, phase, and summary; pure layout functions derive cells, connections, route shape, and camera focus.

## Documentation

- [`docs/01-product-and-mvp.md`](docs/01-product-and-mvp.md) — product vision and scope
- [`docs/02-experience-design.md`](docs/02-experience-design.md) — complete journey, states, visual language, and motion
- [`docs/03-technical-design.md`](docs/03-technical-design.md) — architecture and implementation decisions
- [`docs/04-ai-contract.md`](docs/04-ai-contract.md) — strict model contract, prompt, and mock dataset
- [`docs/05-build-plan.md`](docs/05-build-plan.md) — implementation slices, priorities, and current status
- [`AGENTS.md`](AGENTS.md) — practical rules for continued development

## Remaining work

The main P0 product journey is implemented. The next priority is reliability and rehearsal rather than another architectural rewrite:

1. wire a real local command for Vite plus the serverless endpoint;
2. add direct endpoint tests and finish live/refusal error handling;
3. rehearse the complete mock demo, clipboard handoff, narrow layout, and API-fallback path;
4. add only selected P1 polish after the demo path is stable.

See `docs/05-build-plan.md` for the detailed release gate and deferred P1/P2 work.
