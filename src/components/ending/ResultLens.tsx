import { useState } from "react";
import { motion } from "motion/react";
import type { SummaryPayload } from "../../../shared/ai-contract";

export function ResultLens({ summary, onRestart }: { summary: SummaryPayload; onRestart: () => void }) {
  const [confirmingRestart, setConfirmingRestart] = useState(false);

  return (
    <motion.article
      className="result-lens"
      aria-labelledby="result-heading"
      initial={{ opacity: 0, scale: 0.96, filter: "blur(9px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="eyebrow">What seems to be emerging</p>
      <h1 id="result-heading">{summary.direction}</h1>

      <div className="result-grid">
        <section>
          <h2>What is pulling you there</h2>
          <ul>{summary.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </section>
        <section>
          <h2>What is still unresolved</h2>
          <ul>{summary.doubts.map((doubt) => <li key={doubt}>{doubt}</li>)}</ul>
        </section>
      </div>

      <section className="next-step">
        <h2>One next step</h2>
        <p>{summary.nextStep}</p>
      </section>

      <div className="result-actions">
        {confirmingRestart ? (
          <div className="restart-confirmation" role="group" aria-label="Confirm start over">
            <span>Clear this thread and start over?</span>
            <button className="primary-action" type="button" onClick={onRestart}>Yes, start over</button>
            <button className="quiet-action" type="button" onClick={() => setConfirmingRestart(false)}>Keep this result</button>
          </div>
        ) : (
          <button className="quiet-action restart-action" type="button" onClick={() => setConfirmingRestart(true)}>Start over</button>
        )}
      </div>
    </motion.article>
  );
}

