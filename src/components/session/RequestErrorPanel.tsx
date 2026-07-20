import type { PublicError } from "../../../shared/ai-contract";

export function RequestErrorPanel({
  error,
  onRetry,
  onUsePrepared,
  onRestart,
}: {
  error: PublicError;
  onRetry: () => void;
  onUsePrepared: () => void;
  onRestart: () => void;
}) {
  const canRecover = error.retryable;
  const canUsePrepared = canRecover && error.fallbackAvailable;

  return (
    <aside className="request-error-panel" role="alert" aria-labelledby="request-error-heading">
      <span className="request-error-mark" aria-hidden="true">…</span>
      <p className="eyebrow">Hmm…</p>
      <h1 id="request-error-heading">I lost the thread for a moment.</h1>
      <p>{error.message} Your path is still here.</p>
      <div className="request-error-actions">
        {canRecover ? (
          <button className="primary-action" type="button" onClick={onRetry}>Try again</button>
        ) : null}
        {canUsePrepared ? (
          <button className="quiet-action prepared-action" type="button" onClick={onUsePrepared}>
            Continue with prepared questions
          </button>
        ) : null}
        <button className="quiet-action" type="button" onClick={onRestart}>Start over</button>
      </div>
    </aside>
  );
}
