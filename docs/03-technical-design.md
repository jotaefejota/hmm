# Hmm… — Technical Design

**Status:** Implemented architecture; production deployment verified 2026-07-20

**Depends on:** `docs/01-product-and-mvp.md`, `docs/02-experience-design.md`, and `docs/04-ai-contract.md`

**Goal:** Deliver the complete hackathon experience with strong visual quality in two days, without building a general graph editor, a physics simulation, or a persistent backend.

## Architecture decision in one sentence

Build a single React/Vite application whose session is managed by one reducer, render one persistent authored field of accessible HTML cells over one SVG connection layer, derive content occupancy and marks from semantic history, animate controlled focus changes with Motion, and obtain validated reflection content through one Vercel Function with an automatic local mock fallback.

```mermaid
flowchart LR
    UI["React experience"] --> State["Session reducer"]
    State --> Projection["Occupancy + mark projection"]
    Projection --> Layout["Stable cell field"]
    Layout --> Canvas["HTML cells + SVG edges"]
    State --> Service["Resilient reflection service"]
    Service --> Mock["Mock provider"]
    Service --> Live["Live provider"]
    Live --> Endpoint["POST /api/reflect"]
    Endpoint --> Model["OpenAI Responses API"]
```

The semantic session—not the canvas—is the source of truth. The cell field is stable configuration; occupancy, selected marks, edges, focus, and animations are derived views of the session.

## 1. Specific technology stack

| Layer | Choice | Why this is the smallest suitable option |
| --- | --- | --- |
| Client | React + TypeScript + Vite | Matches the agreed stack, gives rapid component iteration, and keeps the app a simple client-side experience. |
| State | React `useReducer` plus Context | The state is one bounded session with explicit phases. Redux, Zustand, and a state-machine package would add setup without solving a hard problem here. |
| Styling | Plain CSS files, CSS custom properties, and semantic class names | The organic visual treatment needs bespoke shapes, layers, blur, and responsive rules. A utility framework would not remove meaningful work. |
| Cells | A persistent set of absolutely positioned HTML containers holding native buttons/articles | Preserves stable spatial memory, native text wrapping, focus, keyboard behavior, and screen-reader semantics while allowing art-directed placement. |
| Connections | One non-interactive SVG layer behind the HTML cells | SVG paths are easy to draw, fade, and animate while occupied-cell content remains accessible HTML. |
| Animation | Motion for React (`motion`) for focus and content transitions; CSS for simple halos | Motion provides controlled transforms, occupancy fades, and reduced-motion support without introducing a full scene or physics engine. Stable cell elements avoid remount-heavy transition choreography. |
| Validation | Zod in a root `shared/` module | One schema can validate browser requests, server input, model output, and mock fixtures. An exact-length array enforces three answers while producing JSON Schema accepted by Structured Outputs. |
| AI server | One TypeScript Vercel Function in `api/reflect.ts` | Vercel supports Vite projects with functions in an `api` directory, so the frontend and secret-bearing endpoint can deploy together without a separate server. |
| Model API | Official OpenAI JavaScript SDK, Responses API, and Structured Outputs | The SDK can parse a response directly against a Zod schema. Structured Outputs provides schema adherence rather than merely valid JSON. |
| Deployed model | `gpt-4.1-mini`, configurable with server-only `OPENAI_MODEL` | It is sufficient for the strict, short structured contract and keeps the prototype responsive. The contract remains model-independent. |
| Tests | Vitest for reducer, schema, layout, and mock-provider tests | These are the failure-prone pure functions. A full end-to-end suite is not necessary for the two-day prototype. |
| Deployment | Vercel | One static frontend plus one same-repository function is the shortest path to a shareable demo. |

The production deployment is [hmm-mu-rust.vercel.app](https://hmm-mu-rust.vercel.app/). Vercel serves the Vite client and the colocated `api/reflect.ts` function; the deployed endpoint has returned validated live rounds with `Cache-Control: no-store`. Forced mock mode remains the deterministic demonstration and outage fallback.

### Graph-library assessment

Do **not** use React Flow, D3 force layout, Cytoscape, or another graph library for P0.

[React Flow](https://reactflow.dev/) is designed for interactive node editors and includes dragging, selection, connection handles, pan/zoom, and viewport state. Hmm… needs none of those capabilities. It has one short linear path, three temporary possibilities, no user-positioned nodes, and a highly specific visual grammar. Adopting a graph editor would mean translating our session into its node model, disabling editor behavior, overriding its viewport assumptions, and fighting its wrappers while still writing the custom layout and styling.

Carefully positioned persistent HTML cells and SVG paths are smaller and more controllable:

- a small fixed set of authored cell slots is rendered once;
- all connections form one path plus three temporary spokes;
- all legal cell positions and round-to-slot routes are known in advance;
- narrow windows use a different, simpler layout rather than graph zoom;
- the visual result depends more on typography, colour, blur, and timing than graph algorithms.

Reconsider a graph library only if the product later adds editable branches, arbitrary navigation, user-positioned nodes, zoomable history, or sessions much longer than five rounds.

### Official references behind the choices

- [Motion for React layout animation](https://motion.dev/docs/react-layout-animations) documents transform-based layout transitions and shared layout identifiers.
- [Motion `AnimatePresence`](https://motion.dev/docs/react-animate-presence) supports exit sequencing for pruning unchosen answers.
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) documents colocated functions under `api`.
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) recommends schema-constrained output over JSON mode and documents Zod parsing with the JavaScript SDK.
- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model) recommends the Responses API and intentional reasoning-effort selection.

No package versions are specified before the project is scaffolded. Install current stable releases, commit the lockfile immediately, and do not upgrade during the hackathon unless a blocker requires it.

## 2. Folder structure

```text
/
├── api/
│   └── reflect.ts                 # single secret-bearing serverless endpoint
├── docs/
│   ├── 01-product-and-mvp.md
│   ├── 02-experience-design.md
│   ├── 03-technical-design.md
│   └── 04-ai-contract.md
├── references/
├── shared/
│   ├── ai-contract.ts             # Zod request/response/error schemas and types
│   └── limits.ts                  # shared content and round limits
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── AppShell.tsx
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── ThoughtCanvas.tsx
│   │   │   ├── CellField.tsx
│   │   │   ├── Cell.tsx
│   │   │   ├── CellContent.tsx
│   │   │   ├── ConnectionLayer.tsx
│   │   │   └── FieldAtmosphere.tsx
│   │   ├── session/
│   │   │   ├── WelcomeSeed.tsx
│   │   │   ├── AnswerCluster.tsx
│   │   │   ├── CustomAnswerComposer.tsx
│   │   │   ├── ProgressCard.tsx
│   │   │   ├── ClarityPrompt.tsx
│   │   │   ├── GenerationStatus.tsx
│   │   │   └── SessionActions.tsx
│   │   ├── ending/
│   │   │   └── ResultLens.tsx
│   │   └── feedback/
│   │       └── RecoveryNotice.tsx
│   ├── content/
│   │   └── mock-dataset.ts
│   ├── layout/
│   │   ├── cell-field.ts
│   │   ├── projectOccupancy.ts
│   │   ├── desktopLayout.ts
│   │   ├── narrowLayout.ts
│   │   └── curves.ts
│   ├── services/
│   │   ├── reflection-provider.ts
│   │   ├── live-provider.ts
│   │   ├── mock-provider.ts
│   │   └── resilient-provider.ts
│   ├── session/
│   │   ├── SessionContext.tsx
│   │   ├── session-reducer.ts
│   │   ├── session-types.ts
│   │   └── session-selectors.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   ├── canvas.css
│   │   └── motion.css
│   ├── utils/
│   │   ├── chatgpt-handoff.ts
│   │   └── text.ts
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This is an intended boundary map, not a requirement to create an empty file for every line on day one. Keep small files together until a component or pure function has a distinct responsibility.

## 3. Main components and responsibilities

| Component | Responsibility | Must not own |
| --- | --- | --- |
| `App` | Creates the provider and session context; selects the current top-level experience | Cell coordinates or API details |
| `AppShell` | Stable page frame, wordmark, global controls, live announcements | Session transitions |
| `WelcomeSeed` | Welcome and dilemma entry states | Network calls |
| `ThoughtCanvas` | Composes the stable field, connections, semantic occupancy, and active answer controls | Canonical session history |
| `CellField` | Renders the complete authored set of stable cell slots and applies stage focus | Semantic history or provider calls |
| `Cell` | Owns one stable slot identity, geometry, shape, and state-independent membrane | Semantic content identity or its own occupancy |
| `CellContent` | Renders the current semantic treatment and native interaction inside an occupied cell | Cell position or canonical history |
| `ConnectionLayer` | Renders derived SVG paths below nodes | Graph state or hit testing |
| `FieldAtmosphere` | Adds restrained colour/blur behind the same cell field | A second decorative cell grid or continuously simulated motion |
| `AnswerCluster` | Renders exactly three suggestions and the separate custom-answer action | Generating new content |
| `CustomAnswerComposer` | Captures and validates the 160-character custom answer | A fourth suggested answer |
| `ProgressCard` | Displays the original dilemma, committed answers, round count, and derived qualitative status | Duplicate history state, AI confidence, or graph navigation |
| `GenerationStatus` | Shows initial/next/summary loading state | Fake percentages |
| `ClarityPrompt` | Offers ending or one more core question | Deciding that clarity exists |
| `ResultLens` | Displays the four-part summary and handoff actions | Reconstructing the summary from canvas nodes |
| `RecoveryNotice` | Explains live failure, fallback, and retry without losing context | Raw provider error details |
| `SessionContext` | Exposes state and semantic events backed by one reducer | Visual styling |

Use one visually flexible `CellContent` rather than separate components for every semantic colour. Its occupancy kind, status, age, and interactivity determine the treatment described in the experience document. Keep the outer `Cell` keyed by slot ID so changing a question never replaces the spatial object itself.

## 4. Session state model

Use a discriminated phase plus small semantic data. Do not store rendered nodes, connections, or coordinates in canonical state.

```ts
type SessionPhase =
  | "welcome"
  | "entering"
  | "generating-round"
  | "round-ready"
  | "writing-custom-answer"
  | "answer-selected"
  | "transitioning"
  | "clarity-offered"
  | "generating-summary"
  | "ending"
  | "recovering"
  | "error";

type ReflectionStep = {
  round: number;
  question: string;
  answer: string;
  answerSource: "suggested" | "custom";
};

type SessionState = {
  phase: SessionPhase;
  dilemma: string;
  history: ReflectionStep[];
  currentRound: RoundPayload | null;
  selectedAnswer: { text: string; source: "suggested" | "custom" } | null;
  summary: SummaryPayload | null;
  dataSource: "live" | "mock" | null;
  finishReason: "user" | "suggested" | "max-rounds" | "extension" | null;
  extensionUsed: boolean;
  notice: RecoveryNotice | null;
  activeRequestId: number;
};
```

### Reducer rules

- Only reducer events move the phase forward; components never set phases directly.
- `history` contains only completed question/answer pairs.
- `currentRound` contains the active question and exactly three suggestions.
- During `answer-selected`, keep `currentRound` and `selectedAnswer` so the commitment animation can render.
- Append to `history` only once, when the selection animation completes.
- Record `choiceIndex: 0 | 1 | 2` with each committed step so its selected cell can be reconstructed deterministically. This is local presentation metadata and is stripped before validating any AI request; `docs/04-ai-contract.md` remains unchanged.
- Increment `activeRequestId` for each generation request. Ignore any response whose identifier is not current.
- An `AbortController` cancels the previous request on restart or retry.
- Derive round number as `history.length + 1`; do not trust a visual component to count rounds.
- After a fifth core answer, generate the summary without requesting another round.
- `extensionUsed` permits exactly one post-ending question only while fewer than five answers are committed; after its answer, regenerate the summary immediately. The action is absent and the reducer rejects it once the five-round ceiling is reached.
- Restart creates the initial state in one reducer event.

`useReducer` is sufficient because this state is local, synchronous except for two service methods, and never shared between browser tabs or persisted.

The progress card adds no canonical state. A selector derives its items and status from `dilemma`, `history`, `phase`, `currentRound.suggestEnding`, and `extensionUsed`. Tests must prove that it never includes `selectedAnswer` before commitment or an unchosen suggestion.

Trail review is local presentation state only: activating a committed answer in the card sets a temporary `focusOverrideCellId` resolved from history + `choiceIndex` via the same occupancy helpers. Clearing that override (next selection, phase change, or **Back to now**) restores the derived active focus. This is not stored in the session reducer and must not change history.

## 5. Representation of cells, occupancy, and connections

The canvas combines stable authored geometry with a derived semantic projection. These are deliberately different layers.

```ts
type CellSlot = {
  id: `cell-${number}`;
  x: number;
  y: number;
  size: "small" | "medium" | "large";
  shape: "a" | "b" | "c" | "d";
  zone: "seed" | "trail" | "focus" | "possibility" | "ambient";
};

type CellOccupancy = {
  cellId: CellSlot["id"];
  semanticId: string;
  kind: "dilemma" | "question" | "suggestion" | "selected-answer";
  status: "active" | "selected" | "previous" | "entering" | "clearing";
  text: string;
  round: number | null;
  interactive: boolean;
  age: number;
};

type CanvasEdge = {
  id: string;
  fromCellId: CellSlot["id"];
  toCellId: CellSlot["id"];
  status: "active" | "selected" | "previous" | "preview";
};

type CanvasProjection = {
  cells: readonly CellSlot[];
  occupancy: readonly CellOccupancy[];
  edges: readonly CanvasEdge[];
  focusCellId: CellSlot["id"] | null;
};
```

`cell-field.ts` owns a finite deterministic **hex-offset packed** lattice of stable slot IDs and world coordinates. Packing is computed once as module constants—no runtime physics. Odd columns are vertically offset by half a row pitch so each empty cell has six near-neighbours. Empty-cell diameter is set to approximately the pitch (with a small membrane gap of about 2–4% of pitch) so neighbours appear to kiss. `projectOccupancy.ts` (or the equivalent projection inside `projectCanvas.ts`) maps semantic IDs such as `question-2` and `suggestion-2-1` into those slots by replaying the selected option indices. React keys the outer cell elements by `cellId`, never by `semanticId` or an array index.

Question cells occupy alternating lattice columns after the origin. Their three suggestions occupy the next column at `row - 1`, `row`, and `row + 1`; the chosen suggestion row becomes the next question row two columns forward. Starting from the middle row leaves enough vertical capacity for any five-round sequence. Occupied or active cells may scale slightly above the pack for emphasis; empty substrate cells stay packed and quiet. A development assertion must reject duplicate active occupancy, an unknown slot, or a route outside the authored lattice.

Edges are derived in one selector from occupied/marked cell IDs:

1. dilemma cell → first question cell;
2. question cell → selected-answer cell for every completed step;
3. selected-answer cell → next question cell when it exists;
4. current question cell → three currently occupied suggestion cells only while the round is ready;
5. a dotted preview edge to the custom-answer composer only while it is open.

Unchosen suggestions are never added to history. Their content and temporary edges leave through a short occupancy fade; their `Cell` elements and geometry remain mounted.

## 6. Visual positioning strategy

### Shared coordinate model

Use world coordinates across a field approximately two viewport widths wide, expressed entirely in viewport-width units so packing remains isotropic. Every `CellSlot` has a fixed column, row, centre, size tier, and shape variant on the hex-offset pack. Cell centres and SVG endpoints use the same world coordinate system; semantic occupancy never owns coordinates. Column and row pitch, and the matching empty-cell diameter, are shared constants so CSS sizing and layout tests agree.

Connect SVG paths from centre to centre and render them behind opaque node surfaces. The node covers the part of the path inside its body, creating the appearance that the line meets the membrane edge without calculating shape intersections.

Use four authored irregular `border-radius` presets assigned to stable cell IDs. This makes shapes feel organic but repeat identically on every render and in every recording.

### Wide layout

For windows at least 900 px wide:

- reserve a 280–320 px upper-left rectangle for the progress card and keep semantic nodes outside it;
- render the full packed soup of empty cells so neighbours appear to touch; only occupied cells carry readable meaning;
- place the active question near the desktop focal area while its world position advances along the packed route;
- place the three suggestions in the next forward column’s upper, middle, and lower packed neighbours;
- preset enough columns and rows for every five-round combination;
- derive the current row from the prior `choiceIndex` sequence (`0 = up`, `1 = straight`, `2 = down`) rather than from randomness;
- reduce older occupied-cell emphasis to a minimum of `0.58`, while the underlying cell geometry remains present;
- translate the field so the focused question stays near the desktop focal point while its world position advances rightward and vertically.

The cell layout is invariant for a viewport class: the same slot IDs have the same relative geometry before and after every selection. Only the camera transform, content occupancy, selected marks, and semantic edges change. The camera does not attempt to keep the origin or complete path visible.

### Narrow layout

Below 900 px, keep the same logical slot IDs but use an authored narrow projection rather than squeezing the wide coordinate map:

- render the progress card as a disclosure in normal flow above the trail strip;
- render history as a compact horizontal trail strip in normal document flow;
- render the active question as a full-width cell;
- stack the three suggestion buttons vertically;
- use short vertical SVG or CSS connectors;
- render the custom editor as a fixed bottom sheet;
- render the ending in one column.

The breakpoint should be chosen from observed crowding, not device names. The initial 900 px value is a design token that can be adjusted in one place.

### Curves

Every semantic edge is a quadratic Bézier curve. Its control point is the midpoint plus one small, deterministic perpendicular offset derived from the edge ID. Cap the offset so paths never loop or cross. Decorative membrane lines are a separate background asset and never share the semantic edge layer.

## 7. Animation strategy

Use state-driven animation, not a timeline that independently mutates the DOM.

### Motion ownership

- Motion animates the field focus transform and content scale, opacity, and controlled blur; it does not animate cells into existence.
- `AnimatePresence` applies only to content inside stable cells and keeps departing suggestion text mounted until its exit completes.
- SVG `pathLength` animates only a new semantic connection from 0 to 1.
- CSS keyframes own the low-cost active halo and loading pulse.
- No JavaScript animation loop runs continuously.

### Selection sequence

1. Dispatch `SELECT_ANSWER`; enter `answer-selected` immediately.
2. Start fetching the next round in parallel to hide latency.
3. Animate the chosen cell treatment into amber, grow its emphasis, add its permanent mark, and strengthen its connector.
4. Fade the two unused suggestion contents and return those slots to neutral.
5. On exit completion, append the step and enter `transitioning`.
6. Move focus to the next authored neighbourhood, draw its connector, and place the next violet question into its reserved cell.
7. If content is ready, enter `round-ready`; otherwise keep that existing question cell pulsing.

Do not coordinate this with a chain of arbitrary `setTimeout` calls. Use phase changes and animation-completion callbacks, with one short maximum-duration safety fallback so a cancelled animation cannot trap the session.

### Reduced motion

Read the system preference through Motion/CSS. Replace travel, morphing, repeated pulse, and blur with 100–180 ms opacity changes. The reducer and completion events remain identical, so reduced motion is not a separate product path.

## 8. Implementing the decision trail

The decision trail is a projection of `dilemma + history + currentRound` onto stable cell slots, rebuilt on every state change.

- The seed always occupies the first route cell.
- Each completed step leaves one violet question cell and one amber user-answer cell marked along the route.
- The current question occupies the next reserved route cell and is styled active.
- Current suggestions occupy three adjacent stable cells and their spokes exist only temporarily.
- On desktop, `ThoughtCanvas` renders the complete marked field directly. A separate bead-only `TrailView` must not replace committed question and answer content.
- Age is calculated from the active round, then used to reduce scale, contrast, label prominence, and halo strength.
- The immediately previous pair remains fully readable.
- Older desktop labels may wrap more tightly and reduce in size, but remain visibly attached to their cells; abstract `?`/`✓` beads are reserved for the narrow overview.
- At the ending, reuse the same cell field and occupancy projection with an `ending` focus treatment; do not build a second history component for desktop.
- The narrow `TrailStrip` is a compact overview of the same projection, not separate state and not the only visible history.
- `ProgressCard` reads the same ordered `history` selector as the trail; it is a textual index, not a parallel record.

No marked cell is draggable or editable in P0. Clicking old content may expose its full label for accessibility, but it does not navigate or mutate the session.

## 9. Mock and real data through one interface

Both sources implement the same contract from `docs/04-ai-contract.md`.

```ts
interface ReflectionProvider {
  getRound(input: RoundRequest, signal: AbortSignal): Promise<RoundPayload>;
  getSummary(input: SummaryRequest, signal: AbortSignal): Promise<SummaryPayload>;
}

type ContentResult<T> = {
  data: T;
  source: "live" | "mock";
  notice?: { code: string; message: string };
};
```

Provider responsibilities:

- `LiveReflectionProvider` posts validated input to `/api/reflect` and validates the returned payload again.
- `MockReflectionProvider` reads fixtures that already satisfy the same Zod schemas.
- `ResilientReflectionProvider` chooses behavior based on `VITE_CONTENT_MODE=auto|mock|live`.
- In `auto`, try live once; on timeout, network failure, rate limit, or invalid output, return the appropriate mock payload with a recovery notice.
- In `mock`, make no network request.
- In `live`, expose a recoverable error instead of silently switching; reserve this mode for development diagnostics.
- Provider failures are converted into a request-scoped `REQUEST_FAILED` session event. The reducer owns the resulting `error` phase and public error payload; asynchronous callbacks must not throw into React or maintain a parallel component-level error state.

The presenter can force the curated journey with `VITE_CONTENT_MODE=mock` or a documented demo query parameter that selects the same provider. No visible provider selector is required.

For local development, `npm run dev:full` enables a small Vite middleware adapter that invokes the production `api/reflect.ts` handler at the same-origin route. Plain `npm run dev` remains client-only. The adapter loads only `OPENAI_API_KEY` and `OPENAI_MODEL` from `.env.local`; it must never copy the full environment into client-visible Vite variables.

Because the entire short history is sent on every live request, the app can switch from live to mock at any turn without provider-side conversation state.

## 10. Protecting the API key

### Request boundary

Use one same-origin endpoint:

`POST /api/reflect`

The body is the discriminated `RoundRequest | SummaryRequest` from the AI contract. The function:

1. rejects non-POST methods;
2. limits request size and parses JSON;
3. validates and normalizes the body with Zod;
4. applies the hard round and ending gates;
5. calls the OpenAI Responses API with the server-owned system prompt and strict output schema;
6. sets `store: false` because the client sends the complete required history;
7. validates the parsed output and semantic content rules;
8. returns only the contract payload, never the provider response;
9. maps timeouts, refusal, invalid output, and provider errors to small public error codes;
10. sets `Cache-Control: no-store`.

### Secret handling

- Store `OPENAI_API_KEY` only in Vercel server environment variables and local `.env.local`.
- Never prefix it with `VITE_`; Vite-prefixed values are client-exposed.
- Keep `.env*` files ignored except an `.env.example` containing names only.
- Instantiate the OpenAI client only inside the server function.
- The browser sends the dilemma and selected path to our endpoint, never credentials or provider configuration.
- Restrict CORS to same-origin; do not configure a wildcard.

This protects the key from appearing in the bundle or browser requests. It does **not** prevent someone from abusing a public endpoint. For a public demo, set provider usage limits and platform spend alerts; if abuse becomes a concern, disable live mode and serve mocks.

## 11. Loading states, errors, and retries

### Timing policy

- Start the visual generation state immediately.
- Fire the next-round request as soon as an answer is selected, in parallel with the commitment animation.
- Use a roughly 7-second client timeout for the live attempt.
- Do not automatically retry the model before falling back; two slow calls make the demo worse.
- A user-triggered **Try live again** starts one fresh request with a new request ID.
- Aborted and stale requests never change state.
- A failed operation is retained outside the visual components as a small typed descriptor: round versus summary, validated request payload, and the success event it must produce. The reducer retains the pre-error phase so recovery can restore the same semantic point without reconstructing it from the UI.
- **Try again** replays that descriptor through the configured provider. **Continue with prepared questions** replays it through `MockReflectionProvider`. Both allocate a new request ID, and neither edits committed history.
- Development builds may inject timeout or refusal failures through documented query parameters. Production builds ignore them.

### Failure mapping

| Failure | App behavior | Retry |
| --- | --- | --- |
| No API key / endpoint unavailable | Automatic mock response; small persistent notice | Manual live retry only if configuration changes |
| Network error or timeout | Automatic mock response in `auto`; in-context error cell in diagnostic `live` mode | **Try again** or **Continue with prepared questions** |
| Non-2xx provider response | Map to public code; automatic mock | User-triggered retry |
| Model refusal | Show the appropriate static boundary message; do not feed sensitive text into generic mock reflection | No automatic retry |
| JSON/schema invalid | Reject immediately; use mock; log server-side diagnostic | User-triggered retry during development only |
| Semantically invalid content | Reject if answers are duplicated, lengths fail, advice language appears, or question shape is invalid; use mock | No repair call in P0 |
| Mock fixture invalid | Fail tests/build; at runtime show preserved-path error with copy/restart | Retry cannot help |
| Summary failure | Keep complete trail visible; use mock summary or offer retry/prepared summary | One user-triggered retry |
| Clipboard/new-tab failure | Show the prepared prompt for manual copy | User retries the browser action |

The server may log a request ID, error code, duration, and model name. It should not log the user’s full dilemma or answers in the hackathon default.

## 12. What we should intelligently fake

| Desired effect | Controlled implementation |
| --- | --- |
| Organic cells | One finite authored field with four irregular CSS border-radius presets assigned by stable cell ID |
| New rounds appearing | Swap semantic occupancy inside existing cells; do not create new cell geometry |
| Cells making room | Shift focus and emphasis across the fixed field; cells do not physically rearrange |
| Living connections | One authored Bézier curve per semantic relationship with a short path-draw animation |
| Cellular environment | One low-contrast authored SVG/background texture, not generated tessellation |
| Breathing membrane | CSS opacity/scale on one or two pseudo-elements, disabled for reduced motion |
| Physical selection | A small press-and-expand transform, not collision or mass simulation |
| Camera movement | Translate the fixed world so the active question stays near the focal point; optional one-shot review focus from the progress card; no free pan/zoom or physics camera |
| Trail compression | Reduce content emphasis from semantic age while keeping stable slot geometry |
| Clarity detection | Strict model boolean after round 4 plus a hard round-5 stop, not a confidence score |
| Sense of progress | Client-derived round count and named status in a stable card, not an AI-generated certainty score |
| Demo intelligence | One curated fixture and one generic fixture through the production data interface |
| ChatGPT handoff | Build text locally, copy it, and open a new tab; no cross-product session transfer |

The visual trick is spatial memory: the same cells remain in the same relationship while content, marks, connectors, and focus change. Authored motion looks alive even though no physical model exists.

## 13. Technical risks and fallbacks

| Risk | Early warning | Primary mitigation | Fallback |
| --- | --- | --- | --- |
| Text causes node overlap | Long questions wrap beyond expected height | Enforce contract lengths; fixed size tiers; test worst-case strings | Switch wide view to stacked/narrow layout at a larger breakpoint |
| Camera loses spatial continuity | A selection feels like a page replacement instead of travel | Keep one field mounted; animate one transform; retain the previous pair near the entering edge | Shorten horizontal step distance while preserving choice-dependent rows |
| Route reaches a vertical boundary | Repeated upper/lower choices request a missing row | Start in the middle of an eleven-row lattice and test all extreme sequences | Clamp only decorative camera framing, never semantic slot choice |
| Occupancy accidentally remounts cells | Shapes jump or appear newly created between rounds | Key outer `Cell` elements by slot ID; test stable IDs/count/geometry across transitions | Disable field translation and use occupancy fades only |
| HTML cells and SVG lines drift apart | Connections miss centres after resize | Shared normalized coordinates and centre-to-centre paths behind cells | Hide temporary suggestion spokes; keep only selected trail lines |
| Animation state becomes stuck | Controls remain disabled after an interrupted transition | Reducer phases, completion callbacks, stale-request guard, maximum-duration escape | Replace sequence with short opacity transitions |
| Motion work consumes polish time | Layout transitions jitter or require many overrides | Use only translate/scale/opacity/pathLength in P0 | Remove shared-layout effects; keep selection colour and connector draw |
| Live response is slow | Loading regularly exceeds the selection animation | Start request on selection; low reasoning; 7-second cutoff | Automatic mock provider |
| Model returns weak or repetitive questions | Similar questions appear in rounds 2–4 | Strict prompt angles, full selected history, output linter | Curated demo mode; generic authored question bank |
| Structured output fails | Zod parsing rejects a response | Structured Outputs plus identical server validation | No repair loop; use mock immediately |
| Public endpoint is abused | Unexpected request volume or spend | Same-origin, body limits, provider/platform spend controls | Remove live key and deploy mock-only build |
| Vercel function setup delays the team | Local function proxy or deployment differs from Vite dev server | Keep function isolated behind `LiveReflectionProvider` | Run the entire demo in mock mode; add live endpoint after visual flow |
| Narrow layout feels like a different app | Canvas becomes clipped or text becomes tiny | Purpose-built vertical thread and shared semantic styles | Use the narrow layout at all widths for the demo |
| Progress card crowds the canvas | Active or historical nodes render under the card | Reserve a measured exclusion rectangle in wide layout | Collapse the card to its status row until the ending |
| Decorative membrane hurts performance | Blur or paint time causes visible frame drops | Static asset, low layer count, transform/opacity only | Replace with a flat gradient and a few fixed outlines |
| Restart or retry races with old fetch | Old question appears in a new session | Abort requests and compare request IDs before dispatch | Ignore all responses whose session generation changed |
| ChatGPT tab is blocked | Clipboard succeeds but browser blocks delayed `window.open` | Open a blank tab synchronously on click, then copy/navigate | Reveal prompt in an on-page copy panel |
| Sensitive topic reaches generic fallback | Mock asks casual questions about an inappropriate dilemma | Refusal/boundary errors bypass generic mock content | Show static scope boundary and restart action |

## Two-day build order

1. Reducer, schemas, full mock session, and static narrow layout.
2. Persistent authored cell field with derived occupancy, SVG trail, and the progress card.
3. Essential selection/transition/ending animations.
4. Result lens and ChatGPT handoff.
5. Serverless endpoint and live provider.
6. Failure fallback, reduced motion, keyboard pass, and video rehearsal.

If live AI is not stable by the end of step 5, stop work on it. The mock provider is a first-class delivery path, not an emergency branch.
