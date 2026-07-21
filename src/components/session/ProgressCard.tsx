import { useId, useState } from "react";
import type { ProgressView } from "../../session/session-selectors";

export function ProgressCard({
  progress,
  openByDefault = false,
  onFocusAnswer,
  onReturnToNow,
  onReturnToLanding,
  reviewing = false,
}: {
  progress: ProgressView;
  openByDefault?: boolean;
  onFocusAnswer?: (stepIndex: number) => void;
  onReturnToNow?: () => void;
  onReturnToLanding?: () => void;
  reviewing?: boolean;
}) {
  const panelId = useId();
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = openByDefault || (userOpen ?? true);

  return (
    <aside className={`progress-card ${open ? "is-open" : ""}`} aria-label="Reflection progress">
      <button className="progress-brand progress-restart-action" type="button" onClick={onReturnToLanding} disabled={!onReturnToLanding} aria-label="Start again with this thought">
        Hmm<span aria-hidden="true">…</span>
      </button>
      <div id={panelId} className="progress-details" hidden={!open}>
        {onReturnToLanding ? (
          <button className="progress-dilemma progress-restart-action" type="button" onClick={onReturnToLanding}>
            {progress.dilemma}
          </button>
        ) : (
          <p className="progress-dilemma">{progress.dilemma}</p>
        )}
        {progress.answers.length ? (
          <>
            <p className="progress-label">Your thoughts</p>
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
          </>
        ) : null}
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
