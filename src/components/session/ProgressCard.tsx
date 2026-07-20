import { useId, useState } from "react";
import type { ProgressView } from "../../session/session-selectors";

export function ProgressCard({
  progress,
  openByDefault = false,
}: {
  progress: ProgressView;
  openByDefault?: boolean;
}) {
  const panelId = useId();
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = openByDefault || (userOpen ?? true);

  return (
    <aside className={`progress-card ${open ? "is-open" : ""}`} aria-label="Your thread">
      <div className="progress-heading">
        <h2>Your thread</h2>
        <span>{progress.completed} of up to 5</span>
      </div>
      <span className="status-pill"><i aria-hidden="true" />{progress.status}</span>
      <button
        className="progress-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setUserOpen((value) => !(value ?? true))}
      >
        {open ? "Hide details" : "Show details"}
      </button>
      <div id={panelId} className="progress-details" hidden={!open}>
        <p className="progress-label">You’re thinking through</p>
        <p className="progress-dilemma">{progress.dilemma}</p>
        <p className="progress-label">What you’ve chosen so far</p>
        {progress.answers.length ? (
          <ol>{progress.answers.map((answer) => <li key={answer}>{answer}</li>)}</ol>
        ) : (
          <p className="progress-empty">Your choices will gather here.</p>
        )}
      </div>
    </aside>
  );
}
