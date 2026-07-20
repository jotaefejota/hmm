export function GenerationStatus({ dilemma }: { dilemma: string }) {
  return (
    <section className="generation" aria-live="polite" aria-busy="true">
      <div className="generation-seed">
        <span>You brought</span>
        <p>{dilemma}</p>
      </div>
      <div className="generation-line" aria-hidden="true" />
      <div className="generation-question">
        <span className="generation-mark">?</span>
        <p>Hmm… where’s the useful edge?</p>
      </div>
    </section>
  );
}

