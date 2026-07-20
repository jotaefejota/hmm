# Hmm… — Organic Node Dynamics Plan

**Status:** Approved gradual direction; the first directed prototype is implemented, but it has not yet achieved the reference’s fluid continuity.

**Purpose:** Evolve the persistent cellular canvas toward a magnetic, liquid-feeling interaction without replacing accessible HTML controls, the deterministic substrate, or the bounded session model with a global physics engine.

**Depends on:** `docs/02-experience-design.md`, `docs/03-technical-design.md`, `docs/05-build-plan.md`, and the original motion reference recording.

## 1. The visual target

The reference is not a collection of independently animated circles. It behaves like a connected material:

- a selected element is drawn into a local mass rather than merely translated;
- neighbouring elements make room and respond to the event;
- the visible silhouette stretches, compresses, and settles with continuity;
- the transition survives the semantic change from possibility to committed choice;
- the material does not visibly snap back to a preset location after contact.

For Hmm…, this should mean that choosing an answer feels like a thought consolidating. It must not imply that the app has found a correct answer or that the user is being scored.

## 2. Architecture assessment

The application is still a good candidate for a gradual experiment:

- React, TypeScript, and Vite provide a fast, contained UI iteration loop.
- Semantic session state is separate from rendering. The reducer owns dilemma, discovery payloads, choices, history, summary, requests, and recovery; it does not own canvas coordinates.
- `projectCanvas` derives semantic occupancy and connections from canonical state.
- The authored hex-offset lattice supplies stable slot identities, quiet substrate cells, trail memory, and a deterministic fallback.
- `CellField` renders accessible HTML controls, while `ConnectionLayer` renders the non-interactive SVG paths behind them.
- Motion already owns transforms, opacity, and camera movement.

The active canvas contains only a handful of meaningful nodes even though the desktop substrate has many quiet cells. That leaves room for local choreography, provided the app never animates the full field or writes animation state into React on every frame.

### The current limitation

The implemented `organic-directed` layer is a useful Phase 1/2 prototype, not a fluid system. It gives the selected suggestion a small temporary offset toward the question. When selection commits, the semantic projection promotes it to a historical answer and returns it to its stable authored slot.

That explains the observed pull-then-return motion. It is a continuity gap between the visual transition and the semantic commit—not an issue that can be solved by increasing spring strength. The current collision radius is descriptive only; it does not yet move or deform nearby nodes.

## 3. Principles and non-goals

### Principles

1. Keep the session reducer coordinate-free. Visual positions, radii, forces, and animation phases belong in a visual layer.
2. Keep the lattice. It remains the quiet cellular substrate, route memory, review surface, and safe fallback.
3. Animate a small foreground cluster only: the open question, three answers, perhaps the nearest committed bubbles, and a temporary transition membrane.
4. Use one authoritative transition controller. A visual completion must be guarded by a monotonically increasing transition ID and be safely invalidated by restart, retry, resize, or reduced-motion changes.
5. Drive SVG edges from the same displayed positions as their HTML bubbles.
6. Preserve keyboard controls, focus, screen-reader labels, mock mode, narrow vertical-thread behaviour, and reduced-motion meaning.

### Product non-goals

- No user drag, pan, zoom, editable history, or branches.
- No claim of scientifically accurate liquid dynamics.
- No per-frame React reducer updates or persistent velocity in session state.

### Technical constraints, not premature exclusions

The original DOM/SVG direction was selected because it preserves native controls and is quick to ship. The supplied reference changes the evaluation: a renderer or bounded simulation may be warranted if the DOM/SVG membrane spike cannot produce credible material continuity.

Do not permanently rule out D3-force, Matter.js, Canvas, PixiJS, or WebGL before testing the smallest relevant option. Do rule out an arbitrary graph editor: it solves interaction problems Hmm… does not have.

Every technical spike must keep semantics, focus order, keyboard activation, screen-reader labels, history review, mock mode, and reduced-motion behaviour outside the visual engine. A canvas-, Pixi-, or WebGL-rendered visual layer can sit behind or alongside an accessible HTML interaction layer; it must not replace it without an equivalent interaction plan.

## 4. Proposed visual model

Use two rendering layers.

```text
semantic session
  → semantic canvas projection
  → visual target projection
  → local transition controller + membrane overlay
  → HTML node shells + SVG edges + quiet lattice
```

### Persistent substrate

The authored lattice continues to render quiet cell outlines and committed trail locations. It keeps the field recognisable as one persistent space and gives historical nodes stable, reviewable homes.

### Active organic cluster

The current question, its answers, and the selection-transition overlay receive visual positions that can differ from their lattice slots. The cluster is local and temporary. It uses deterministic asymmetric presets at rest, then bounded choreography during selection.

### Transition membrane

To deliver the reference’s central quality, add one temporary foreground surface spanning the active question and chosen answer during commitment. It can be made with an SVG path or clipped/masked HTML/SVG overlay with blurred, soft edges. It is not four circles glued together and it is not the historical node itself.

The membrane should:

- begin as two visually distinct masses;
- stretch toward the selected answer as it is attracted;
- briefly form one shared, slightly irregular contour;
- dissolve only after the historical answer has a settled trail position;
- leave the question/answer history readable rather than replacing it.

This preserves semantic truth while avoiding the visual snap caused by directly reusing the selected bubble as the historical bubble.

## 5. Transition lifecycle

```text
idle
  → selection-start
  → answer-attracting
  → membrane-forming / primary-growing
  → siblings-retreating
  → trail-settling
  → next-lenses-emerging
  → ready
```

On answer selection:

1. Lock the semantic answer once; rapid repeated activation must be ignored.
2. Capture the question and chosen-answer screen/world positions as a visual snapshot.
3. Keep that snapshot alive through the reducer’s answer-to-history change.
4. Pull the chosen answer inward by a bounded distance; grow the question modestly; fade the siblings outward.
5. Form and settle the temporary membrane, with a very small delayed local response from adjacent active/history bubbles if space requires it.
6. Crossfade or travel from the snapshot to the committed trail position. Do not restore the chosen answer to its old suggestion coordinate.
7. Reveal the next two lenses only after the cluster reaches a clear settled state; generation may continue concurrently as it does today.

Reduced motion skips travel and deformation: it uses an immediate selected state, short fades, explicit text state, and the same semantic completion.

## 6. Phased delivery

### Phase 0 — safety seam and fallback

**Status:** Implemented in part.

Keep `grid`, `organic-directed`, and reserved `organic-force` layout modes. `grid` remains a safe environment-variable fallback. The session and provider contracts remain unchanged.

**Acceptance:** mock mode, live fallback, review, restart, summary, and narrow layout work with `grid`.

### Phase 1 — separate semantic occupancy from visual placement

**Status:** Implemented in part.

Keep the `VisualNode` target model and visual positions outside the reducer. `CellField` should consume targets, and connections should use matching endpoints.

**Remaining acceptance:** semantic node changes must retain a stable visual snapshot long enough to bridge a selected suggestion into its committed trail representation.

### Phase 2 — deterministic organic rest state

**Status:** Implemented in part.

Use stable, asymmetric targets for lenses, an active question, three answers, selected answer, and nearest history. Any variation must be seeded from semantic IDs, never generated at render time. Keep readable text and a persistent lattice underneath.

**Acceptance:** no jitter, no collisions at rest, and different decision routes still visibly diverge.

### Phase 3 — visual-continuity transition

**Status:** Next required phase.

Replace the current temporary answer offset with a transition controller and snapshot/membrane overlay. This is the minimum correction required to prevent the pull-then-return effect.

**Acceptance:**

- selected answer never visibly returns to its discarded suggestion position;
- a reset, stale request, or reduced-motion setting cannot complete an old transition;
- next lenses emerge only after a consistent settled state;
- SVG edges remain attached to the displayed node positions;
- rapid selection cannot commit more than one answer.

### Phase 4 — local collision relaxation

**Status:** Optional, only after Phase 3 visual review.

If Phase 3 still feels staged, run a fixed number of local separation iterations for no more than the active cluster and immediate neighbours. The solver runs only at transition setup, produces target positions, then stops. It has no retained velocity and no idle work.

**Acceptance:** no overlap, no jitter, stable browser behaviour, no perceptible idle CPU work.

### Phase 5 — restrained material polish

**Status:** Optional.

Add small delayed neighbour response, stable contour irregularity, and typographic easing while the primary grows. Do not add per-frame contour deformation merely for decoration.

## 7. Technical choices

| Option | Current decision | What would justify it |
| --- | --- | --- |
| Directed DOM/SVG choreography | First Phase 3 spike | It is the lowest-cost way to test visual continuity with the existing accessible renderer. |
| SVG transition membrane | First Phase 3 spike | It can create a temporary shared silhouette without a renderer rewrite. |
| Fixed-iteration local relaxation | Candidate Phase 4 spike | It may make nearby bubbles yield convincingly while retaining deterministic rest positions. |
| D3-force | Candidate only for local relaxation | It is useful if fixed-iteration separation and attraction prove insufficient; it must run only for a bounded local cluster and sleep immediately. |
| Matter.js | Candidate for a deliberately physical prototype | It becomes reasonable if momentum, collision, and soft constraints prove essential, but text labels and deterministic settling need a separate accessibility/interaction layer. |
| Canvas / PixiJS | Candidate renderer spike | It becomes reasonable if DOM/SVG cannot make the membrane, blending, or many local deformations look credible at the required frame rate. |
| WebGL | Last-resort renderer spike | Consider only if 2D Canvas/Pixi cannot achieve the desired field effects; it increases complexity and must retain HTML accessibility overlays. |
| Arbitrary graph editor | Reject | It solves editing, drag, and navigation problems that are outside the product. |

## 8. Test and review plan

### Automated

- Visual target tests: stable IDs, deterministic output, no illegal overlaps for authored presets.
- Transition-controller tests: stale transition IDs, restart, retry, resize, reduced motion, and rapid repeat selection.
- Projection tests: committed trail semantics do not depend on visual coordinates.
- Component tests: exactly one answer commits; sibling options clear; next lenses do not appear early; connections use visual endpoints.
- Regression tests: mock path, live fallback, summary, restart, history review, and narrow layout.

### Manual

- Compare the selection moment against the supplied reference: does it look like local consolidation rather than a card sliding then resetting?
- Test desktop and narrow layouts; narrow keeps the vertical thread and may use fades rather than membrane deformation.
- Test keyboard-only selection, visible focus, Escape/review, and reduced motion.
- Test rapid clicking, restart during a transition, delayed discovery responses, and mock mode without network access.

Run `npm run check` and a complete forced-mock journey before declaring any phase complete.

## 9. Go/no-go decision

The gradual approach still makes sense, with one correction: the current directed offset should not be considered the destination or evidence that the fluid idea has succeeded. It validated the renderer seam and endpoint synchronisation, but not the intended material behaviour.

Start with the Phase 3 DOM/SVG spike because it is cheap and reversible—not because it is assumed to be the final renderer. If it cannot create a convincing sense of consolidation, compare two narrowly scoped alternatives before committing architecture:

1. a fixed-iteration local-force spike (with D3-force or a small custom solver) for a maximum of seven active nodes;
2. a Canvas or Pixi visual-overlay spike, while retaining HTML buttons and text as the accessible interaction layer.

Advance only the option that demonstrably improves continuity, remains readable, survives restart/reduced-motion behaviour, and can coexist with the persistent history. Matter.js and WebGL remain valid later experiments if those two do not meet the visual bar; neither should be adopted just because it is more physically expressive.

## 10. Smallest convincing next prototype

Desktop mock mode only:

- one active question and three answers;
- select one answer;
- preserve a visual snapshot across semantic commitment;
- selected answer is attracted 10–18% toward the question;
- question grows by roughly 10–14%;
- unselected answers retreat and fade;
- a temporary soft SVG membrane visibly spans the question and selected answer;
- the membrane settles into a readable question/answer trail without a snap-back;
- SVG connections stay attached.

This is the right next experiment because it answers the core question quickly: whether the app can feel like a thought gathering itself, while retaining its present accessibility and deterministic product behaviour.
