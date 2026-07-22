# Hmm…

Hmm… turns a dilemma into two useful angles, three possible responses, and a living trail of what matters. It never decides for you. It just helps your thinking take shape.

**Live demo:** [hmm-mu-rust.vercel.app](https://hmm-mu-rust.vercel.app/)

## Why this exists

Decisions are often unclear because the important trade-offs are still tangled, not because someone needs an all-knowing answer. Hmm… creates a small, bounded space to articulate those trade-offs: it asks a useful question, offers possible directions, and makes the reasoning trail visible. The person stays in charge of the decision.

## What you can do

- open a question lens, choose a response, and watch a thought-path grow;
- review or revise a settled choice without becoming lost in a graph;
- crack open the occasional fortune-cookie angle;
- pause at **Something is taking shape** for a tentative recap and next step;
- continue in ChatGPT, restart, or keep exploring;
- demo the whole thing with no API key or network.

## OpenAI inside

Hmm… uses the **Responses API**, **Structured Outputs**, and **GPT-5.6 Terra** (`gpt-5.6-terra`) for concise, schema-validated reflection rounds. Codex helped shape and build the prototype. The API key stays server-side; mock mode is always available.

Each live turn sends the original dilemma and the committed path, then receives exactly two question lenses, three responses for each lens, and an optional fresh angle. Zod validates the response before it reaches the canvas. If live generation is unavailable, the same experience continues with curated mock content.

## Built with

- Codex
- ChatGPT 5.6 models
- React, TypeScript, and Vite
- Motion for React and CSS for controlled organic movement
- D3-force for local pressure and collision settling in the bubble field
- Zod for shared structured-output contracts
- Vitest for reducer, provider, contract, and layout tests
- Vercel Functions for the server-side OpenAI call

## How Codex helped

Codex accelerated the prototype by helping turn the concept into a small build plan, defining the strict GPT contract, implementing and testing the reducer-driven session flow, iterating on the canvas layout and animations, and keeping documentation, checks, and deployment instructions aligned as the experience evolved.

## Human decisions

The product direction and creative calls were made by the author: Hmm… is deliberately a thinking companion rather than a decision-maker; the experience favours two discoverable lenses over a linear questionnaire; the canvas keeps one chosen trail instead of becoming a branching graph; and mock-first delivery keeps the demo reliable without compromising the live GPT-5.6 path. The visual language (an organic field of bubbles, settled ideas, optional fortune-cookie angles, and a tentative ending) was also chosen and refined by the author.

## Run it

```bash
npm install
VITE_CONTENT_MODE=mock npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Mock mode is the reliable, camera-demo path.

For live generation, copy `.env.example` to `.env.local`:

```dotenv
VITE_CONTENT_MODE=auto
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-terra
```

Then run `npm run dev:full`. Never put the API key in a `VITE_` variable or commit it.

## Demo beat

1. Start with something like: *Would a new camera help me get back into photography?*
2. Tap on a lens and follow four choices.
3. Tap **Something is taking shape** → **Discover**.
4. Show the recap, then **Continue in ChatGPT** if you want to dig deeper.

## Submission kit

- Source code — this repository
- Hosted demo — [hmm-mu-rust.vercel.app](https://hmm-mu-rust.vercel.app/)
- Demo video — [watch on YouTube](https://youtu.be/xaJKmPVUqwo)

## License

[MIT](LICENSE) © 2026 jotaefejota.

## Checks

```bash
npm run check
```

That runs linting, TypeScript, tests, and a production build. The project keeps no accounts, database, analytics, or saved decision history—just the thought in front of you.
