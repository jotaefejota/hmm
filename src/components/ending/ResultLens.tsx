import { useState } from "react";
import { motion } from "motion/react";
import type { SummaryPayload } from "../../../shared/ai-contract";
import type { ReflectionStep } from "../../session/session-types";
import { handoffToChatGpt } from "../../utils/chatgpt-handoff";

type ResultLensProps = {
  summary: SummaryPayload;
  dilemma: string;
  history: ReflectionStep[];
  canExtend?: boolean;
  onExploreDoubt?: (focus: string) => void;
  onRestart: () => void;
};

export function ResultLens({
  summary,
  dilemma,
  history,
  canExtend = false,
  onExploreDoubt,
  onRestart,
}: ResultLensProps) {
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [manualPrompt, setManualPrompt] = useState<string | null>(null);
  const primaryDoubt = summary.doubts[0];

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

      {handoffMessage ? <p className="handoff-feedback" role="status">{handoffMessage}</p> : null}
      {manualPrompt ? (
        <textarea className="handoff-prompt" readOnly value={manualPrompt} aria-label="ChatGPT context prompt" />
      ) : null}

      <div className="result-actions">
        {confirmingRestart ? (
          <div className="restart-confirmation" role="group" aria-label="Confirm start over">
            <span>Clear this thread and start over?</span>
            <button className="primary-action" type="button" onClick={onRestart}>Yes, start over</button>
            <button className="quiet-action" type="button" onClick={() => setConfirmingRestart(false)}>Keep this result</button>
          </div>
        ) : (
          <>
            <button className="primary-action" type="button" onClick={() => void continueInChatGpt()}>
              Continue in ChatGPT
            </button>
            {canExtend && primaryDoubt && onExploreDoubt ? (
              <button
                className="quiet-action"
                type="button"
                onClick={() => onExploreDoubt(primaryDoubt)}
              >
                Explore one remaining doubt
              </button>
            ) : null}
            <button className="quiet-action restart-action" type="button" onClick={() => setConfirmingRestart(true)}>
              Start over
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
}
