# Hmm… — Product Vision and MVP

**Status:** Initial product definition

**Purpose:** Align the hackathon team on what to build, what to demonstrate, and what not to build

**Working name:** Hmm…

## 1. Product vision

Hmm… is a curious companion for thinking through a decision.

It gives the user a small, calm space to state what is on their mind, respond to one useful question at a time, and see their line of thought take shape across a persistent field of connected cells. The cells are the stable surface of the experience: questions and possibilities move into focus within them, while selected cells keep a visible mark of the route taken. After a short journey, Hmm… reflects back the direction that appears to be emerging, why it matters, what remains uncertain, and one practical next step.

The product does not predict outcomes, optimize the user’s life, or make a decision on the user’s behalf. Its value comes from helping the user hear and examine their own reasoning. The intended feeling is less “an AI gave me the answer” and more “I can finally see what I think.”

### Product promise

> Bring one question. Follow a short thread of useful prompts. Leave with more clarity and a next step.

### Design principles

1. **The user is the source of truth.** Hmm… helps articulate a choice; it does not declare the correct choice.
2. **One thought at a time.** The interface avoids forms, dashboards, and walls of text.
3. **Visible thinking.** The recent path remains around the active area, while a compact progress card keeps the original dilemma and complete chosen sequence easy to review when older cells travel off-screen.
4. **One world, moving attention.** Rounds travel across a stable cellular field larger than the viewport. The quiet cells pack like a soup of latent possibilities—touching their neighbours—while content occupancy and the camera uncover the path; the interface does not manufacture a new molecule after every choice.
5. **Finite by design.** A useful session reaches a natural pause within a few rounds.
6. **Alive, not elaborate.** Motion, scale, lines, blur, and colour create an organic character without complex physics or 3D.
7. **Graceful without AI.** A complete, convincing session remains demonstrable when the generation API is unavailable.

## 2. The problem it solves

People often become stuck on a decision not because they lack information, but because their priorities, fears, assumptions, and trade-offs are mixed together. Common tools do not serve this moment particularly well:

- search engines produce more information when the user may need reflection;
- blank notes require the user to invent both the questions and the answers;
- pros-and-cons lists flatten emotional and contextual factors;
- general chat interfaces can become long, text-heavy, and overly authoritative;
- advice from another person can pull attention toward what that person would do.

Hmm… creates a lightweight structure for self-explanation. It reduces the effort of knowing what to ask next, limits each moment to three manageable directions, and externalizes the reasoning as a visual path. The immediate job is not to guarantee a perfect decision. It is to help the user identify what they are leaning toward, what is driving that inclination, and what they can do next.

### Primary user and moment

The MVP is for an individual with a bounded, non-emergency decision that can benefit from reflection—for example, whether to accept a new role, start a side project, change a plan, or have a difficult conversation.

The MVP is not intended for crisis support or for high-stakes medical, legal, financial, or safety decisions. In those situations it should avoid presenting its output as professional guidance.

## 3. Personality principles

Hmm… should feel attentive, lightly skeptical, warm, and concise. Its personality lives in the wording and timing of questions, not in an avatar.

### It should

- sound curious rather than certain;
- use short, natural prompts that invite a reaction;
- gently challenge an assumption without becoming argumentative;
- reflect the user’s own language where useful;
- vary its stance: clarify, test, reframe, imagine, or make concrete;
- acknowledge uncertainty and mixed feelings;
- leave agency explicitly with the user;
- use “Hmm…” sparingly as a beat, not as a catchphrase on every screen.

Example voice:

- “What would really change if you said yes?”
- “I’m not entirely convinced that time is the real issue…”
- “Which part of this feels hardest to undo?”
- “Would you like to test that possibility?”
- “Hmm… what are you protecting by waiting?”

### It should not

- say “You should…”, “The best choice is…”, or claim to know the user better than they know themselves;
- predict a future outcome or assign confidence scores to life choices;
- flatter, diagnose, moralize, or manufacture urgency;
- ask compound questions that require an essay;
- repeat the user’s words without adding a useful angle;
- imitate therapy or present itself as a therapist;
- turn playful language into gimmickry.

### Answer-option principles

Each set of three answers should be distinct, plausible, and written in the first person so selection feels like self-expression. Together they should represent meaningfully different directions, not synonyms. Keep them short enough to scan at a glance—ideally 2–8 words—and avoid loading one as the obviously “good” answer.

## 4. Main session flow

### 4.1 Arrive and begin

The landing state contains one clear invitation: **“What are you thinking through?”** The user enters a question or short description and starts the session. A single example prompt can reduce blank-page anxiety.

The product sets the expectation that this is a brief reflection, not an answer machine.

### 4.2 First question

The user’s original thought occupies the seed cell in a persistent authored cellular field. Hmm… places one follow-up question and three answers into nearby existing cells and brings that neighbourhood into focus.

The question cell has the strongest hierarchy. Answer cells are visibly smaller and differentiated through shape treatment, typography, border, colour, and subtle motion. Connecting lines make the relationship legible.

### 4.3 Explore

The user selects one answer. Its cell becomes active, grows slightly, receives a lasting user mark, and determines whether the route bends upward, continues forward, or bends downward. The next question occupies the following existing cell in that direction. The two rejected answers clear from their cells, which return to the quiet substrate. The camera follows the new neighbourhood instead of pulling the route back into the original viewport.

A stable progress card also keeps the original dilemma, the selected answers in order, the current round count, and a qualitative session status visible. It is a readable index of the visual path, not a second conversation or navigation tree.

This repeats for **at least 3 and at most 5 answered questions**:

- rounds 1–2 clarify what matters and surface the main tension;
- rounds 3–4 test trade-offs, assumptions, reversibility, or consequences;
- round 5, when needed, converts the emerging insight into a direction or experiment.

Only the active question and its three answers are interactive. The previous path is visual context, not a navigable decision tree in P0.

### 4.4 Choose to finish

From the second answered question onward, the user can select **“I think I’ve got it.”** After the fourth answer, Hmm… may suggest that a direction is forming. After the fifth answer, the session moves to the ending automatically rather than continuing indefinitely.

The app may propose ending based on the generated response, but it must never claim certainty or hide the user-controlled finish action.

### 4.5 Reflect the emerging direction

The network settles into the background and a concise ending appears with:

1. **What seems to be emerging** — a tentative statement of the user’s current direction;
2. **What is pulling you there** — 2–3 reasons grounded in selected answers;
3. **What is still unresolved** — 1–2 doubts, assumptions, or missing facts;
4. **One next step** — a concrete, proportionate action, preferably reversible;
5. **Continue exploring** — return to reflection if the user is not done.

The summary uses language such as “You seem to be leaning toward…” and “Based on what you chose…” It must not convert the reflection into a command.

The progress card remains alongside the result so the user can compare the emerging direction with the exact path they took.

### 4.6 Take the context elsewhere

The ending also offers **“Continue in ChatGPT.”** For the MVP this action:

1. prepares a plain-text prompt containing the original question, selected path, summary, unresolved doubts, and a request to continue as a curious thinking companion;
2. copies that prompt to the clipboard;
3. opens ChatGPT in a new tab;
4. clearly tells the user to paste the copied context.

No account linking or automatic conversation transfer is required.

## 5. Exact MVP scope

The MVP is a single-user, responsive web experience designed for a reliable 2–4 minute demo.

### Technical baseline

- React, TypeScript, and Vite for the client application;
- simple HTML, CSS, and SVG for the visual network and motion;
- one small server-side or serverless endpoint for live generation;
- no login, database, or complex infrastructure;
- deployable as one lightweight hackathon project.

### Included experience

- one landing state with a text input for a single decision, question, or idea;
- one visual exploration canvas built from simple DOM/SVG shapes and connecting lines;
- one stable deterministic field of reusable cell slots extending beyond the viewport, packed so empty neighbours appear to touch; rounds change content occupancy and camera focus rather than adding new bubble geometry;
- a choice-dependent route in which selecting the upper, middle, or lower possibility produces a different next segment;
- one active central question with exactly three suggested answer options per round;
- a separate “None quite fit” action for entering one brief custom answer;
- selection animation that promotes the chosen answer and reveals the next question;
- a persistent, non-interactive trail made from marked cells and selected-path connectors;
- a persistent progress card showing the original dilemma, ordered selected answers, round count, and qualitative session status;
- a standard 3–5 answered-question journey, with an explicit user-controlled finish available after round 2;
- a user-controlled “I think I’ve got it” finish action from round 2;
- an automatic finish after round 5;
- a final reflection containing an emerging direction, reasons, remaining doubts, and one next step;
- “Continue exploring,” “Start over,” and “Continue in ChatGPT” actions;
- clipboard generation for the ChatGPT continuation prompt;
- loading, generation-error, and clipboard-success feedback;
- one polished, deterministic mock journey for the recommended demo scenario;
- a small generic mock content set that can complete a session for other inputs;
- live generation through a server-side endpoint when configured;
- automatic fallback to mock content when live generation fails or is unavailable;
- no API secret in browser code, browser storage, client bundles, or network requests visible to the client;
- usable desktop layout and a functional mobile layout;
- respect for reduced-motion preferences;
- session state kept only in memory for the current page visit.

### Content contract for live generation

For each round, generation returns one concise question, exactly three concise answer options, and a signal indicating whether a natural ending may be offered. Final generation returns the four required summary elements. Invalid or incomplete output falls back to valid mock content rather than breaking the session.

### Deliberate MVP constraints

- The path is linear: only the chosen answer persists; unchosen branches disappear.
- A previous step cannot be edited or revisited.
- The user chooses one of three suggestions or writes one brief custom answer through a separate “None quite fit” action.
- Refreshing the page resets the session.
- English is the only supported language for the hackathon build.
- The visual network uses authored transitions, not a physics engine.
- The cellular field has a finite preset lattice large enough for every five-round route. It is not infinite, random, or generated as the user advances.
- Automatic camera movement follows the route; user-controlled pan and zoom remain out of scope.
- The live AI provider is replaceable behind one server-side boundary, but the MVP needs only one configured provider.

## 6. Priorities

### P0 — required for the hackathon demo

- Clear landing prompt and session start.
- Organic persistent-cell visual language with unmistakable question/answer hierarchy and moving focus.
- Smooth selection and transition between rounds.
- Exactly three answer directions per question.
- A compact custom-answer path when none of the three suggestions fits.
- Visible trail of chosen thoughts.
- A readable progress card that stays synchronized with the chosen trail through the ending.
- Complete 3–5 round session with a finite ending.
- Final reflection with direction, reasons, doubts, and next step.
- Continue, restart, and copy/open-ChatGPT actions.
- Live dynamic generation through a server-side endpoint.
- Deterministic mock fallback and a force-mock mode for demo reliability.
- API-key secrecy and basic malformed-response handling.
- Responsive layout, keyboard-operable controls, visible focus, and reduced-motion support.

### P1 — valuable if P0 is stable

- A small opening transition that assembles the first molecule.
- More varied transition choreography and question “thinking” states.
- Manual choice between live and demo content in a hidden presenter control.
- Copy the final reflection independently of the ChatGPT prompt.
- Basic client-side session restoration after an accidental refresh.
- More expressive validation and coaching for overly long custom answers.
- More curated mock scenarios.
- Lightweight, privacy-conscious event instrumentation for demo evaluation.
- Improved small-screen trail navigation or zoom-to-active behaviour.

### Out of scope

- Accounts, authentication, profiles, or cross-device history.
- Database storage or a browsable archive of past decisions.
- Multi-user sessions, shared canvases, comments, or collaboration.
- Autonomous decisions, predictions, recommendations presented as correct, or probability scores.
- Numeric certainty, confidence, clarity, completion, or decision-quality scores.
- Medical, legal, financial, crisis, or therapeutic guidance.
- Voice input/output, avatars, characters, or a visible assistant persona.
- Arbitrary tree exploration, branch comparison, undo, or editable history.
- Real-time multiplayer, notifications, reminders, or calendar integrations.
- Automatic transfer of content into a ChatGPT conversation.
- Model/provider selection in the user interface.
- Payments, subscriptions, admin panels, or content-management systems.
- Localization beyond English.
- Native mobile apps or offline/PWA installation.
- Advanced physics, liquid simulation, 3D rendering, WebGL, or generative particle systems.
- Procedural infinite grids, newly generated cell geometry per round, or user-controlled canvas navigation.
- Comprehensive analytics, experimentation platforms, or production-scale infrastructure.

## 7. Recommended demo scenario

### Scenario

**“Should I accept a team-lead role if it means less hands-on creative work?”**

This scenario works well because it is relatable, has no universally correct answer, contains a clear trade-off, and can reveal a satisfying shift from a binary question to a more actionable condition.

### Curated demo path

The exact wording may evolve, but the deterministic demo should support this narrative:

1. **Question:** “What makes the role appealing right now?”
   - **Selected answer:** “I want more influence.”
2. **Question:** “What are you most reluctant to give up?”
   - **Selected answer:** “Making things myself.”
3. **Question:** “Would leadership still appeal if you protected some creative time?”
   - **Selected answer:** “Yes, that changes it.”
4. **Question:** “What would you need to know before saying yes?”
   - **Selected answer:** “Whether the role is flexible.”

### Expected ending

- **Emerging direction:** The user appears open to the role, but not to a version that removes hands-on work entirely.
- **Reasons:** They want greater influence and still value making things directly.
- **Remaining doubt:** The actual role design and flexibility are unknown.
- **Next step:** Ask the hiring manager whether one day per week can remain protected for hands-on work before deciding.

### Suggested video beat

Start with the quiet cellular field, enter the scenario, make four choices while focus travels and selected cells become marked, finish with “I think I’ve got it,” reveal the summary, then click “Continue in ChatGPT” to show the prompt-copy handoff. The full sequence should be understandable without narration and fit comfortably within 90 seconds.

## 8. Verifiable success criteria

The MVP is successful when all of the following can be demonstrated in a clean browser session.

### Comprehension and flow

- A first-time viewer can identify the active question, the three possible answers, and the previously selected path without explanation.
- A user can start from a blank landing state and reach a final reflection in no more than 5 answered questions.
- “I think I’ve got it” is available after the second answer, and the session always ends after the fifth.
- At no point is more than one question or more than three generated answer suggestions presented as active; the separate custom-answer action does not create a fourth suggestion.
- A user can choose “None quite fit,” enter a brief answer in their own words, and continue through the same selected-answer transition.
- The progress card always shows the exact original dilemma, every committed answer once and in order, and a round count consistent with the visible trail.
- The recommended demo path can be completed in 90 seconds or less by a presenter.

### Output quality

- Every live or mock round presents one question and exactly three non-empty, meaningfully distinct answer options.
- The final screen always contains all four required elements: emerging direction, 2–3 reasons, 1–2 remaining doubts/assumptions, and one concrete next step.
- The final direction is framed tentatively and is traceable to the original input and selected answers.
- The product never states that it has made the decision or guarantees an outcome.
- The generated ChatGPT prompt includes the original question, every selected question/answer pair, the four-part summary, and an instruction to continue exploring without deciding for the user.

### Visual and interaction quality

- Questions and answers are distinguishable without relying on colour alone.
- Selecting an answer produces a visible state change and reveals the next question without a hard page transition.
- The same authored cell slots remain spatially recognizable across rounds; no fresh set of bubbles appears after selection.
- Two sessions that choose different option positions produce visibly different spatial routes through the same field.
- The camera follows the active cells toward new territory and does not compress the complete path into the current viewport.
- All selected cells and their connections remain visible as a trail, with the active content retaining strongest hierarchy.
- Rejected suggestion content disappears, but its underlying neutral cells remain part of the field.
- The progress card remains legible without competing with the active question and is still available beside the final result.
- Primary controls work with keyboard only and show a visible focus state.
- With reduced motion enabled, the flow remains complete and understandable without large scaling or continuous movement.
- The layout remains usable at representative mobile and laptop widths without clipped primary controls or unreadable active content.

### Reliability and security

- The curated demo completes from start to finish with the generation API disconnected.
- A generation timeout, network failure, or malformed response results in mock content or a recoverable retry state; it never leaves an empty canvas.
- The presenter can deliberately run the entire app in deterministic mock mode.
- No API key or provider secret appears in shipped client files, browser storage, or browser-visible request payloads.
- Refreshing or choosing “Start over” clears the current in-memory session and returns to the landing state.
- Copying the continuation prompt produces visible success feedback; if clipboard access fails, the prompt remains available for manual copying.

## 9. Decisions that still require confirmation

None of these decisions blocks initial design or implementation; the defaults below keep the two-day build small.

| Decision | Recommended MVP default | Why it still merits confirmation |
| --- | --- | --- |
| Public name and punctuation | Use **Hmm…** in the interface and `hmm` in technical identifiers. | Trademark/domain checks and final brand styling have not been done. |
| Visual palette | Use a warm off-white cellular field, ink text, violet for Hmm…, amber for the user, and neutral suggestions. | Exact colour values and contrast need validation in the first visual prototype. |
| Live AI provider/model | **Confirmed for the deployed prototype:** use `gpt-4.1-mini`, configurable through the server-only `OPENAI_MODEL` variable. | Revisit only if event latency, access, or cost makes the live path unreliable; mock mode remains the demo-safe default. |
| Hosting target | **Confirmed:** one Vercel project hosts the Vite client and `/api/reflect` function at [hmm-mu-rust.vercel.app](https://hmm-mu-rust.vercel.app/). | Custom domain and longer-term ownership are post-hackathon decisions. |
| Custom-answer length | P0 allows a custom answer of up to 160 characters through a separate “None quite fit” action. | The limit should be validated with real prompts so it stays expressive without breaking node layouts. |
| Automatic ending logic | Offer a soft ending after round 4 and force the summary after round 5. | Live testing may show that 3 or 4 rounds feels better. |
| Sensitive-topic handling | Display a brief boundary message and avoid guidance for crisis or professional-advice scenarios. | Exact wording and whether to block or redirect such sessions require a product decision. |
| ChatGPT handoff | Copy context, open ChatGPT in a new tab, and instruct the user to paste. | Browser behaviour and the preferred ChatGPT destination URL should be verified. |
| Data posture | Keep the session in memory and send only required context for generation; do not persist it. | The prototype is publicly reachable, so a user-facing privacy statement remains necessary before promoting it beyond the hackathon demo. |
| Success evaluation at the event | Use the acceptance criteria above plus 3–5 observed test sessions. | The team may want a specific qualitative clarity question or demo metric. |

## MVP guardrail

If a proposed feature does not make the 90-second demo clearer, the visual journey more memorable, the ending more useful, or the session more reliable, it does not belong in the hackathon MVP.
