import { useEffect } from "react";
import type { ReflectionStep } from "../../session/session-types";

export function TrailReviewCard({ step, onClose }: { step: ReflectionStep; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <aside className="trail-review-card" aria-label={`Review round ${step.round}`}>
      <span className="node-label">Looking back · {step.round}</span>
      <h2>{step.lensTheme}</h2>
      <p>{step.question}</p>
      <strong>You chose</strong>
      <p>{step.answer}</p>
      <button type="button" className="quiet-action" onClick={onClose}>Back to now</button>
    </aside>
  );
}
