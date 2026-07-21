import { useEffect, useRef, useState } from "react";
import { DILEMMA_MAX_LENGTH } from "../../../shared/limits";
import { CAMERA_DILEMMA } from "../../content/mock-dataset";
import type { SessionPhase } from "../../session/session-types";

type WelcomeSeedProps = {
  phase: SessionPhase;
  onSubmit: (dilemma: string) => Promise<void>;
};

export function WelcomeSeed({ phase, onSubmit }: WelcomeSeedProps) {
  const [dilemma, setDilemma] = useState(CAMERA_DILEMMA);
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
        <p className="welcome-brand" aria-label="Hmm">Hmm<span aria-hidden="true">…</span></p>
        <h1 id="welcome-title">Clarify your next move</h1>

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
              <button className="primary-action" type="submit" disabled={!dilemma.trim()}>
                Think it through <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}
