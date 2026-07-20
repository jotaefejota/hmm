# Hmm… repository guide

## Product purpose

Hmm… is a curious companion that helps people think through a bounded decision. It asks one useful question, offers exactly three possible answers, and makes the selected path visible. It reflects what appears to be emerging; it never predicts, scores, or decides for the user.

Read the relevant files in `docs/` before changing product behavior. In particular:

- `docs/01-product-and-mvp.md` defines scope and priorities.
- `docs/02-experience-design.md` defines states, copy, visual meaning, and motion.
- `docs/03-technical-design.md` defines architecture and boundaries.
- `docs/04-ai-contract.md` defines exact model I/O.
- `docs/05-build-plan.md` defines implementation order and acceptance checks.

## Stack

- React, TypeScript, and Vite
- Plain CSS with custom properties
- Accessible HTML nodes over one SVG connection layer
- Motion for React for controlled transitions
- React `useReducer` + Context for session state
- Zod for shared contracts and fixture validation
- Vitest for pure state, schema, provider, and layout tests
- One TypeScript Vercel Function for live OpenAI calls

Do not introduce a graph library, physics engine, global state library, CSS framework, database, or authentication without an explicit scope change.

## Repository structure

- `api/`: secret-bearing serverless code only
- `shared/`: contracts and limits shared by browser and server
- `src/components/`: visual and interaction components
- `src/session/`: canonical reducer, events, selectors, and types
- `src/layout/`: pure deterministic node/edge projection
- `src/services/`: live, mock, and resilient content providers
- `src/content/`: validated mock scenarios
- `src/styles/`: tokens, global styles, canvas, and motion
- `docs/`: product, experience, technical, AI, and build contracts
- `references/`: visual references, not production UI assets by default

## Commands

Scaffolding must provide and preserve these commands:

- Install: `npm install`
- Client development: `npm run dev`
- Full local development with the function: `npm run dev:full`
- Tests once: `npm test`
- Tests in watch mode: `npm run test:watch`
- Type checking: `npm run typecheck`
- Lint: `npm run lint`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Required full check: `npm run check`

`npm run check` must run lint, type checking, tests, and production build. If a command does not exist yet, establishing it is part of scaffolding—not a reason to skip the check.

## TypeScript and component conventions

- Keep TypeScript strict. Do not use `any`; narrow `unknown` at boundaries.
- Derive API types from the shared Zod schemas. Do not duplicate wire-contract interfaces.
- Keep the semantic session in one reducer. Components dispatch events; they do not invent phases.
- Store dilemma, selected history, current round, and summary—not rendered nodes or coordinates.
- Derive canvas nodes, edges, ages, and positions with pure selectors/layout functions.
- Keep service calls outside presentational components.
- Use stable semantic IDs such as `question-2`; never use array indexes as React identity.
- Prefer native `button`, `textarea`, headings, and live regions over clickable generic elements.
- Keep components focused, but do not create empty abstractions before they earn a responsibility.
- Add tests for reducer transitions, contracts, mock fixtures, provider fallback, and layout invariants.

## Essential visual rules

- One active Hmm… question, exactly three generated suggestions, and one separate **None quite fit** action.
- Violet belongs to Hmm…; amber belongs to the user; neutral cells are unchosen possibilities. Never rely on colour alone.
- Only the selected path persists. Remove dead branches and avoid crossed semantic connections.
- Use deterministic authored positions and controlled transforms—no physics, random layout, or pan/zoom canvas.
- Questions dominate suggestions through size, label, border, and motion.
- Previous nodes become quieter but the chosen path remains understandable.
- Do not display percentages, confidence, probability, or “correct” green states.
- Narrow layouts become a vertical thread; they are not a scaled-down desktop graph.
- Respect `prefers-reduced-motion`; meaning must survive with simple fades.

## Mock mode and secrets

- Preserve a complete API-free session at all times. `VITE_CONTENT_MODE=mock` must reach the curated ending without making a network request.
- Live and mock providers must return the same validated contract.
- A live failure must preserve the path and fall back automatically where safe.
- Never place `OPENAI_API_KEY` or another secret in `src/`, browser storage, a `VITE_` variable, the client bundle, or browser-visible payloads.
- Secrets belong only in server environment variables and uncommitted `.env.local` files.
- Do not log full dilemmas or selected answers by default.

## Before declaring a task complete

Run every check relevant to the changed area, then run `npm run check`. Also verify the affected flow in forced mock mode. For visual or interaction changes, inspect both a desktop and a narrow viewport, keyboard operation, visible focus, and reduced motion. For server changes, verify that the production client bundle contains no secret and that API failure still completes through mock content.

## Definition of done

A task is done only when its observable outcome and acceptance criteria work, relevant tests exist and pass, `npm run check` passes, the full mock demo still works, accessibility and responsive behavior have not regressed, no secret can reach the client, and any changed contract is reflected in the documentation. “It compiles on my path” is not done.
