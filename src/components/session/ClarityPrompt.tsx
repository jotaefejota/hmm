export function ClarityPrompt({ onFinish, onContinue }: { onFinish: () => void; onContinue: () => void }) {
  return (
    <aside className="clarity-prompt" aria-labelledby="clarity-heading">
      <span className="clarity-mark" aria-hidden="true">✦</span>
      <p className="eyebrow">Hmm…</p>
      <h1 id="clarity-heading">A direction is taking shape.</h1>
      <p>You can see what’s emerging, or stay with it for one more question.</p>
      <div className="clarity-actions">
        <button className="primary-action" type="button" onClick={onFinish}>See what’s emerging</button>
        <button className="quiet-action" type="button" onClick={onContinue}>One more question</button>
      </div>
    </aside>
  );
}

