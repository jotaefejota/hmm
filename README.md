# hmm

Hmm… is a curious companion that helps you think through a bounded decision—not decide for you.

## Run

```bash
npm install
VITE_CONTENT_MODE=mock npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

Forced mock mode completes the curated team-lead demo without network calls. For live generation:

```bash
# .env.local
OPENAI_API_KEY=…
OPENAI_MODEL=gpt-4.1-mini
VITE_CONTENT_MODE=auto
npm run dev:full
```

`dev:full` starts Vite and mounts the same `/api/reflect` handler used in production. It loads `OPENAI_API_KEY` and `OPENAI_MODEL` from `.env.local` into server-side code only. Use `VITE_CONTENT_MODE=auto` to fall back to the prepared journey when the endpoint is unavailable, or `VITE_CONTENT_MODE=live` to expose a recoverable error for diagnostics.

## Checks

```bash
npm run check
```

## Demo path

1. Start with a thought → keep the prefilled team-lead dilemma → Think it through  
2. Choose the first suggestion four times  
3. See what’s emerging → Continue in ChatGPT / Explore one remaining doubt / Start over

If clipboard access is blocked, the ChatGPT handoff reveals the complete prepared prompt so it can be copied manually.
