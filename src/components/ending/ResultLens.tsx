import { useState } from "react";
import { motion } from "motion/react";
import type { SummaryPayload } from "../../../shared/ai-contract";
import type { OpenedFortune, ReflectionStep } from "../../session/session-types";
import { handoffToChatGpt } from "../../utils/chatgpt-handoff";

type ResultLensProps = {
  summary: SummaryPayload;
  dilemma: string;
  history: ReflectionStep[];
  fortunes?: readonly OpenedFortune[];
  canExtend?: boolean;
  canContinue?: boolean;
  onContinueExploring?: () => void;
  onRestart: () => void;
  onDismiss?: () => void;
};

export function ResultLensSkeleton() {
  return (
    <article className="result-lens result-lens-skeleton" aria-label="Gathering your thoughts" aria-busy="true">
      <p className="skeleton-status">Gathering your thoughts…</p>
      <span className="skeleton-line skeleton-title" />
      <section className="skeleton-next-step" aria-hidden="true">
        <span className="skeleton-line skeleton-kicker" />
        <span className="skeleton-line skeleton-copy" />
      </section>
      <div className="result-grid" aria-hidden="true">
        <section>
          <span className="skeleton-line skeleton-kicker" />
          <span className="skeleton-line skeleton-copy" />
          <span className="skeleton-line skeleton-copy short" />
        </section>
        <section>
          <span className="skeleton-line skeleton-kicker" />
          <span className="skeleton-line skeleton-copy" />
          <span className="skeleton-line skeleton-copy short" />
        </section>
      </div>
    </article>
  );
}

export function ResultLens({
  summary,
  dilemma,
  history,
  fortunes = [],
  canExtend = false,
  canContinue = false,
  onContinueExploring,
  onRestart,
  onDismiss,
}: ResultLensProps) {
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [manualPrompt, setManualPrompt] = useState<string | null>(null);

  const continueInChatGpt = async () => {
    const result = await handoffToChatGpt(dilemma, history, summary);
    if (result.status === "copied") {
      setManualPrompt(null);
      setHandoffMessage("Context copied. Paste it into ChatGPT when the new tab opens.");
      return;
    }
    setHandoffMessage("Clipboard access was blocked. Copy the prompt below and paste it into ChatGPT.");
    setManualPrompt(result.prompt);
  };

  return (
    <motion.article
      className="result-lens"
      aria-labelledby="result-heading"
      initial={{ opacity: 0, scale: 0.96, filter: "blur(9px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 id="result-heading">{summary.direction}</h1>

      <section className="next-step">
        <h2>Next step</h2>
        <p>{summary.nextStep}</p>
      </section>

      <div className="result-grid">
        <section>
          <h2>Why</h2>
          <ul>{summary.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </section>
        <section>
          <h2>Open questions</h2>
          <ul>{summary.doubts.map((doubt) => <li key={doubt}>{doubt}</li>)}</ul>
        </section>
      </div>

      {fortunes.length > 0 ? (
        <section className="opened-fortunes" aria-label="Angles you opened">
          <h2>Fresh angles</h2>
          <ul>{fortunes.map((fortune) => <li key={`${fortune.round}-${fortune.text}`}>✦ {fortune.text}</li>)}</ul>
        </section>
      ) : null}

      {handoffMessage ? <p className="handoff-feedback" role="status">{handoffMessage}</p> : null}
      {manualPrompt ? (
        <textarea className="handoff-prompt" readOnly value={manualPrompt} aria-label="ChatGPT context prompt" />
      ) : null}

      <div className="result-actions">
        {confirmingRestart ? (
          <div className="restart-confirmation" role="group" aria-label="Confirm start over">
            <span>Clear this thread and start again?</span>
            <button className="primary-action" type="button" onClick={onRestart}>Yes, start again</button>
            <button className="quiet-action" type="button" onClick={() => setConfirmingRestart(false)}>Keep this result</button>
          </div>
        ) : (
          <>
            <button className="primary-action" type="button" onClick={() => void continueInChatGpt()}>
              Continue in ChatGPT
            </button>
            <button
              className="quiet-action"
              type="button"
              disabled={!canContinue && !canExtend}
              onClick={() => {
                if (canContinue && onDismiss) onDismiss();
                else if (canExtend) onContinueExploring?.();
              }}
            >
              Continue exploring
            </button>
            <button className="quiet-action restart-action" type="button" onClick={() => setConfirmingRestart(true)}>
              Start again
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
}
