# Hmm… — Authored Organic Canvas Reset

**Status:** In progress — Slices A, B, and D complete; transition refinement has begun; authored route-region work remains. Replaces the uniform-cell visual foundation and supersedes the selection-membrane experiment.

## 1. Core decision

The canvas is not a grid of equal circles waiting for animation to make it feel organic. It is a persistent, authored field of unequal membranes from the first frame.

The field may still use deterministic coordinates underneath, but those coordinates are implementation scaffolding—not the visual grammar. What users see is a living collection of differently sized, softly imperfect cells with a few available cells becoming meaningful at any moment.

## 2. The cell vocabulary

Every stable canvas slot has an authored footprint. A footprint defines its size, aspect ratio, silhouette, and bounded deterministic positional offset.

| Footprint | Role in the field | Visual character |
| --- | --- | --- |
| `seed` | Quiet background cell | Small, almost circular, low contrast. |
| `pebble` | Quiet or historical cell | Slightly flattened circle; asymmetric radius. |
| `orb` | Available lens or compact answer | Medium near-circle with a soft inner halo. |
| `shell` | Full Hmm… question | Large, rounded semi-circle / inflated capsule; clear internal room for text. |
| `capsule` | Longer answer or contextual angle | Horizontal or vertical rounded lobe, never a sharp card. |
| `pool` | Reflection / ending state | Large, shallow merged shape spanning a small authored cluster. |

No footprint is perfectly geometric. Each uses one of a small set of stable border-radius profiles, chosen from its slot ID. The variation is deterministic: the same session position always looks like the same cell.

## 3. Size hierarchy

The field has three scale bands before content arrives:

- **quiet:** 0.72–1.0 base scale; mostly `seed` and `pebble` cells;
- **available:** 0.95–1.18 base scale; an available lens becomes noticeable through halo, icon, label, and focus—not just size;
- **meaningful:** 1.12–1.55 base scale; active question, selected answer, reflection pool, and direct-review target.

Semantic role may temporarily raise a slot within its authored allowance. A question is always large enough to read, but it does not turn every route into the same large purple circle.

## 4. Layout rules

1. Keep deterministic authored positions and stable slot IDs. History review, route identity, accessibility, and camera focus depend on them.
2. Replace the visually regular hex field with an **authored atlas**: controlled per-slot size/aspect/offset profiles that create packed, irregular neighbourhoods.
3. Preserve near-touching membranes; small overlaps are permitted only as visual layering, never as unreadable text collisions.
4. Questions and answers choose adjacent compatible footprints. A long answer prefers a capsule; a short answer can occupy an orb or pebble.
5. The two lenses need not mirror one another. One may be an upper orb while the other is a lower capsule or shell fragment, provided each is clearly available and equally actionable.
6. Different chosen paths still travel through distinct authored regions. The camera follows the current region; it does not refit the full trail into view.
7. Narrow layout remains a semantic vertical thread. It uses the same hierarchy and labels, not literal scaled-down shapes.

## 5. Semantic treatments

| Meaning | Footprint treatment |
| --- | --- |
| Original dilemma | Warm amber `pebble` or compact `capsule`; persistent but quieter. |
| Available lens | Violet `orb` / `capsule` with question pin and restrained glow. |
| Open Hmm… question | Large violet `shell`; this is the local visual centre. |
| Suggested answer | Neutral `orb`, `pebble`, or `capsule`, chosen by authored slot and copy length. |
| Selected answer | Amber version of its footprint; permanent trail mark after commitment. |
| Previous question | Quieter violet footprint; directly reviewable. |
| Reflection / ending | Teal `pool` spanning a deliberate nearby cluster. |

Colour reinforces semantic state; label, icon, border, size, and focus treatment must still communicate it without colour.

## 6. Selection and path behaviour

The first reset implementation does **not** attempt a fluid merge. Selection must be clear and complete before adding material dynamics:

1. selected answer gains amber treatment and a bounded scale lift;
2. unselected answers fade back into their quiet authored footprints;
3. the chosen question and answer settle as readable, persistent trail nodes;
4. the next two lenses emerge in the next authored region;
5. camera movement follows the active region after content is stable.

Only after this static heterogeneous field and its semantic transitions are satisfying should we decide whether an intentionally designed transformation belongs between step 1 and step 3. Any future fluid transition needs a defined semantic end state; it must not dissolve two nodes merely to recreate them.

## 7. Implementation sequence

### Slice A — heterogeneous substrate

- Extend `CellSlot` with `footprint`, `scale`, `aspectRatio`, and bounded positional offset.
- Render varied quiet cells in the existing persistent field.
- Keep the existing session, provider, route, edge, and review model unchanged.

**Proof:** desktop shows a recognisably irregular cellular field before a user begins a session; narrow layout is unchanged.

**Implementation note (2026-07-21):** Complete. Each stable cell now carries a deterministic footprint, scale, aspect ratio, and small positional offset. The reducer, provider, routes, and history model remain unchanged.

### Slice B — semantic footprint assignment

- Map lenses, questions, suggestions, history, dilemma, and ending to compatible footprints.
- Add content-length-aware answer treatment without measuring text at runtime.
- Verify all route combinations remain legible and do not create avoidable collisions.

**Proof:** a round contains visibly distinct question, lens, and answer membranes even before selection.

**Implementation note (2026-07-21):** Complete initial pass. Semantic roles now select compatible footprints while the semantic session, route, and provider boundaries remain unchanged. Route-region tuning and exhaustive collision review remain.

### Slice C — authored route regions

- Adjust slot atlas and connection endpoints so every lens/answer choice reaches a visually different neighbourhood.
- Keep direct review and progress-card anchors working against stable slot IDs.

**Proof:** two different choice sequences produce visibly different composition, not merely different labels in a repeated template.

### Slice D — bounded pressure layout

- Use `d3-force` only as a short, deterministic collision pass over the active cell and a bounded local neighbourhood.
- Keep each cell's authored position as a `forceX`/`forceY` home anchor; the active cell's semantic size supplies its collision radius.
- Give meaningful cells stronger home anchors than quiet cells, so pressure travels outward through the substrate instead of relocating the active question itself.
- Stop after a fixed number of ticks, then animate accessible HTML cells and SVG connection endpoints to the settled coordinates.
- The simulation may displace several rings of neighbours, but it must not run continuously, reorder semantic content, or enable user drag/pan/zoom.

**Proof:** growing an active question creates visible, calm pressure through nearby cells and settles reproducibly.

**Implementation note (2026-07-21):** Complete initial pass. `pressure-layout.ts` runs 72 fixed D3 collision ticks over a 4.6-pitch neighbourhood. Active questions and selected answers have stronger home anchors than quiet cells, so nearby substrate yields first. Rendered HTML cells and SVG connectors share the settled coordinate map; the reducer and provider contract do not participate.

### Slice E — controlled transitions

- Restore only clear semantic motion: selected lift, sibling retreat, trail settling, lens emergence, and camera focus.
- Test rapid selection, restart, stale requests, reduced motion, keyboard operation, and narrow layout.

**Proof:** the complete mock journey feels coherent without any liquid effect.

**Implementation note (2026-07-21):** Started. Opening a lens now enlarges the active question footprint, and an answer gains a short, visible semantic lift while its neighbours settle under local pressure. SVG connectors interpolate to the same settled endpoints, so the path moves with the cells. Remaining work is route-specific transition timing and full mock/reduced-motion rehearsal.

### Slice F — optional material experiment

- Define a real post-selection state first.
- Prototype only if it improves the completed heterogeneous field.
- Keep it isolated, reversible, and below the accessible HTML layer.

## 8. Explicitly deferred

- Continuous whole-canvas physics, Matter.js, PixiJS, and WebGL.
- Random layout at render time.
- User-controlled drag/pan/zoom.
- Canvas as the primary interaction layer.
- Liquid merge effects before the semantic end state is agreed.

## 9. Acceptance criteria for the reset

- The resting canvas feels intentionally organic before any animation runs.
- Cells vary meaningfully in size and soft silhouette without looking decorative or chaotic.
- The active question is unmistakable; the three answers remain immediately scannable.
- The original dilemma, trail, progress card, review controls, mock mode, and ending still work.
- Different choices lead through visibly different regions.
- A complete mock session works with reduced motion and in a narrow viewport.
- No secret, API contract, reducer semantics, or provider behaviour changes.
