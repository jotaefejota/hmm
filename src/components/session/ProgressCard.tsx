import type { ProgressView } from "../../session/session-selectors";

export function ProgressCard({ progress }: { progress: ProgressView }) {
  return (
    <aside className="progress-card" aria-label="Your thread">
      <div className="progress-heading">
        <h2>Your thread</h2>
        <span>{progress.completed} of up to 5</span>
      </div>
      <span className="status-pill"><i aria-hidden="true" />{progress.status}</span>
      <p className="progress-label">You’re thinking through</p>
      <p className="progress-dilemma">{progress.dilemma}</p>
      <p className="progress-label">What you’ve chosen so far</p>
      {progress.answers.length ? (
        <ol>{progress.answers.map((answer) => <li key={answer}>{answer}</li>)}</ol>
      ) : (
        <p className="progress-empty">Your choices will gather here.</p>
      )}
    </aside>
  );
}

