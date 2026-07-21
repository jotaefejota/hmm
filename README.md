# Hmm…

> A small, visual place to untangle one decision.

Hmm… turns a dilemma into two useful angles, three possible responses, and a living trail of what matters. It never decides for you. It just helps your thinking take shape.

**Live demo:** [hmm-mu-rust.vercel.app](https://hmm-mu-rust.vercel.app/)

## What you can do

- open a question lens, choose a response, and watch a thought-path grow;
- review or revise a settled choice without becoming lost in a graph;
- crack open the occasional fortune-cookie angle;
- pause at **Something is taking shape** for a tentative recap and next step;
- continue in ChatGPT, restart, or keep exploring;
- demo the whole thing with no API key or network.

## OpenAI inside

Hmm… uses the **Responses API**, **Structured Outputs**, and **GPT-5.6 Terra** (`gpt-5.6-terra`) for concise, schema-validated reflection rounds. Codex helped shape and build the prototype. The API key stays server-side; mock mode is always available.

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

1. Start with: *Would a new camera help me get back into photography?*
2. Open a lens and follow four choices.
3. Tap **Something is taking shape** → **Discover**.
4. Show the recap, then **Continue in ChatGPT**.

## Submission kit

- [x] Source code — this repository
- [x] Hosted demo — [hmm-mu-rust.vercel.app](https://hmm-mu-rust.vercel.app/)
- [ ] Demo video — add the final link before submitting

## Checks

```bash
npm run check
```

That runs linting, TypeScript, tests, and a production build. The project keeps no accounts, database, analytics, or saved decision history—just the thought in front of you.
