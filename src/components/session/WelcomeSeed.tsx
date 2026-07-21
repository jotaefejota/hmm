import { useEffect, useRef, useState } from "react";
import { DILEMMA_MAX_LENGTH } from "../../../shared/limits";
import hmmLogo from "../../assets/hmm-logo-transparent.png";
import { pickLandingPrompts } from "../../content/landing-prompts";
import type { SessionPhase } from "../../session/session-types";
import { projectCanvas } from "../../layout/projectCanvas";
import { settleLocalPressure } from "../../layout/pressure-layout";
import { geometryForCell } from "../../layout/cell-geometry";
import { CELL_SIZE_RATIO, DILEMMA_CELL_ID, FIELD_WIDTH, getCellSlot } from "../../layout/cell-field";

type WelcomeSeedProps = {
  phase: SessionPhase;
  onSubmit: (dilemma: string) => Promise<void>;
  initialDilemma?: string;
};

type SeedHandoff = {
  from: DOMRect;
  to: { left: number; top: number; width: number; height: number };
};

const LANDING_HANDOFF_MS = 720;

const firstSeedTarget = (dilemma: string) => {
  const projection = projectCanvas({
    dilemma,
    history: [],
    currentDiscovery: null,
    selectedLensIndex: null,
    phase: "generating-round",
    selectedAnswer: null,
  });
  const positions = settleLocalPressure(projection);
  const seedSlot = getCellSlot(DILEMMA_CELL_ID);
  const seedPosition = positions.get(DILEMMA_CELL_ID) ?? seedSlot;
  const focusSlot = getCellSlot(projection.focusCellId);
  const focusPosition = positions.get(projection.focusCellId) ?? focusSlot;
  const seedItem = projection.occupancy.find((item) => item.cellId === DILEMMA_CELL_ID);
  const geometry = geometryForCell(seedSlot, seedItem);
  const width = window.innerWidth * (FIELD_WIDTH * CELL_SIZE_RATIO * geometry.scale) / 100;
  const height = width / geometry.aspectRatio;
  const centreX = window.innerWidth * (54 + seedPosition.x - focusPosition.x) / 100;
  const centreY = window.innerHeight / 2 + window.innerWidth * (seedPosition.y - focusPosition.y) / 100;
  return { left: centreX - width / 2, top: centreY - height / 2, width, height };
};

export function WelcomeSeed({ phase, onSubmit, initialDilemma }: WelcomeSeedProps) {
  const [landingIdeas] = useState(() => pickLandingPrompts(4));
  const [dilemma, setDilemma] = useState(() => initialDilemma?.trim() || landingIdeas[0]);
  const promptSuggestions = landingIdeas.slice(1);
  const [isDeparting, setIsDeparting] = useState(false);
  const [handoff, setHandoff] = useState<SeedHandoff | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const departureTimer = useRef<number | null>(null);
  const isEntering = phase === "entering";

  useEffect(() => {
    if (isEntering) inputRef.current?.focus();
  }, [isEntering]);

  useEffect(() => () => {
    if (departureTimer.current !== null) window.clearTimeout(departureTimer.current);
  }, []);

  const submit = () => {
    if (!dilemma.trim() || isDeparting) return;
    const inputBounds = inputRef.current?.getBoundingClientRect();
    setIsDeparting(true);
    const useReducedMotion = typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (useReducedMotion) {
      void onSubmit(dilemma);
      return;
    }
    if (inputBounds) setHandoff({ from: inputBounds, to: firstSeedTarget(dilemma) });
    departureTimer.current = window.setTimeout(() => void onSubmit(dilemma), LANDING_HANDOFF_MS);
  };

  return (
    <section className={`welcome ${isDeparting ? "is-departing" : ""}`} aria-labelledby="welcome-title" aria-busy={isDeparting}>
      <div className="welcome-orbit welcome-orbit-one" aria-hidden="true" />
      <div className="welcome-orbit welcome-orbit-two" aria-hidden="true" />
      {handoff ? (
        <div
          className="landing-handoff-seed"
          aria-hidden="true"
          style={{
            "--handoff-from-left": `${handoff.from.left}px`,
            "--handoff-from-top": `${handoff.from.top}px`,
            "--handoff-from-width": `${handoff.from.width}px`,
            "--handoff-from-height": `${handoff.from.height}px`,
            "--handoff-to-left": `${handoff.to.left}px`,
            "--handoff-to-top": `${handoff.to.top}px`,
            "--handoff-to-width": `${handoff.to.width}px`,
            "--handoff-to-height": `${handoff.to.height}px`,
          } as React.CSSProperties}
        >
          <span>{dilemma}</span>
        </div>
      ) : null}
      <div className={`welcome-seed ${isEntering ? "is-open" : ""} ${isDeparting ? "is-departing" : ""}`}>
        <h1 id="welcome-title">Clarify your next move</h1>

        {isEntering ? (
          <form
            className={`dilemma-form ${isDeparting ? "is-departing" : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="dilemma-input">
              <textarea
                ref={inputRef}
                id="dilemma"
                aria-label="Your thought"
                value={dilemma}
                maxLength={DILEMMA_MAX_LENGTH}
                rows={3}
                disabled={isDeparting}
                onChange={(event) => setDilemma(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              {dilemma && !isDeparting ? (
                <button className="clear-dilemma" type="button" aria-label="Clear thought" onClick={() => {
                  setDilemma("");
                  inputRef.current?.focus();
                }}>×</button>
              ) : null}
            </div>
            <div className="form-actions">
              <button className="primary-action" type="submit" disabled={!dilemma.trim() || isDeparting}>
                <img className="landing-button-logo" src={hmmLogo} alt="Hmm…" />
              </button>
            </div>
            <div className="landing-prompts" role="group" aria-label="Try a question">
              <p>Need a spark?</p>
              <div>
                {promptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isDeparting}
                    onClick={() => {
                      setDilemma(prompt);
                      inputRef.current?.focus();
                    }}
                  >{prompt}</button>
                ))}
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}
