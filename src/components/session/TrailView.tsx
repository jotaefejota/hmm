import type { ReflectionStep } from "../../session/session-types";

export function TrailView({ dilemma, history, ending = false }: { dilemma: string; history: ReflectionStep[]; ending?: boolean }) {
  return (
    <nav className={`trail-view ${ending ? "is-ending" : ""}`} aria-label="Chosen reflection path">
      <span className="trail-bead trail-origin" aria-label={`You brought: ${dilemma}`} title={dilemma}>You</span>
      {history.map((step) => (
        <span className="trail-pair" key={step.round}>
          <span className="trail-link" aria-hidden="true" />
          <span className="trail-bead trail-question" aria-label={`Question ${step.round}: ${step.question}`} title={step.question}>?</span>
          <span className="trail-link" aria-hidden="true" />
          <span className="trail-bead trail-answer" aria-label={`Your answer ${step.round}: ${step.answer}`} title={step.answer}>✓</span>
        </span>
      ))}
    </nav>
  );
}

