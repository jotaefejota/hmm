import { useId, useState } from "react";
import type { ProgressView } from "../../session/session-selectors";

export function ProgressCard({
  progress,
  openByDefault = false,
  onFocusAnswer,
  onReturnToNow,
  reviewing = false,
}: {
  progress: ProgressView;
  openByDefault?: boolean;
  onFocusAnswer?: (stepIndex: number) => void;
  onReturnToNow?: () => void;
  reviewing?: boolean;
}) {
  const panelId = useId();
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = openByDefault || (userOpen ?? true);

  return (
    <aside className={`progress-card ${open ? "is-open" : ""}`} aria-label="Reflection progress">
      <p className="progress-brand" aria-label="Hmm">
        Hmm<span aria-hidden="true">…</span>
      </p>
      <div id={panelId} className="progress-details" hidden={!open}>
        <p className="progress-dilemma">{progress.dilemma}</p>
        <p className="progress-label">Your thoughts</p>
        {progress.answers.length ? (
          <ol className="progress-answers">
            {progress.answers.map((answer, index) => (
              <li key={`${index}-${answer}`}>
                {onFocusAnswer ? (
                  <button
                    className="progress-answer-action"
                    type="button"
                    onClick={() => onFocusAnswer(index)}
                  >
                    {answer}
                  </button>
                ) : (
                  answer
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="progress-empty">Your choices will gather here.</p>
        )}
        {reviewing && onReturnToNow ? (
          <button className="progress-return" type="button" onClick={onReturnToNow}>
            Back to now
          </button>
        ) : null}
      </div>
      <p className={`status-pill ${progress.isThinking ? "is-thinking" : ""}`} aria-live="polite"><i aria-hidden="true" />{progress.status}</p>
      <button
        className="progress-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setUserOpen((value) => !(value ?? true))}
      >
        {open ? "Hide details" : "Show details"}
      </button>
    </aside>
  );
}
