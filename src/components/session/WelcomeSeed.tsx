import { useEffect, useRef, useState } from "react";
import { DILEMMA_MAX_LENGTH } from "../../../shared/limits";
import { TEAM_LEAD_DILEMMA } from "../../content/mock-dataset";
import type { SessionPhase } from "../../session/session-types";

type WelcomeSeedProps = {
  phase: SessionPhase;
  onOpen: () => void;
  onCancel: () => void;
  onSubmit: (dilemma: string) => Promise<void>;
};

export function WelcomeSeed({ phase, onOpen, onCancel, onSubmit }: WelcomeSeedProps) {
  const [dilemma, setDilemma] = useState(TEAM_LEAD_DILEMMA);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isEntering = phase === "entering";

  useEffect(() => {
    if (isEntering) inputRef.current?.focus();
  }, [isEntering]);

  const submit = () => {
    if (dilemma.trim()) void onSubmit(dilemma);
  };

  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <div className="welcome-orbit welcome-orbit-one" aria-hidden="true" />
      <div className="welcome-orbit welcome-orbit-two" aria-hidden="true" />
      <div className={`welcome-seed ${isEntering ? "is-open" : ""}`}>
        <span className="eyebrow">A small place to think</span>
        <h1 id="welcome-title">What are you thinking through?</h1>
        <p className="welcome-support">Bring one question. We’ll follow it for a few turns.</p>

        {isEntering ? (
          <form
            className="dilemma-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="dilemma">Your question or dilemma</label>
            <textarea
              ref={inputRef}
              id="dilemma"
              value={dilemma}
              maxLength={DILEMMA_MAX_LENGTH}
              rows={3}
              onChange={(event) => setDilemma(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <div className="form-actions">
              <button className="quiet-action" type="button" onClick={onCancel}>Back</button>
              <button className="primary-action" type="submit" disabled={!dilemma.trim()}>
                Think it through <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            <button className="primary-action welcome-action" type="button" onClick={onOpen}>
              Start with a thought <span aria-hidden="true">↗</span>
            </button>
            <p className="demo-question">
              <span>Demo dilemma</span>
              “{TEAM_LEAD_DILEMMA}”
            </p>
          </>
        )}
      </div>
    </section>
  );
}
