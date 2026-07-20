import { useState } from "react";
import { CUSTOM_ANSWER_MAX_LENGTH } from "../../../shared/limits";

export function CustomAnswerComposer({ onSubmit, onCancel }: { onSubmit: (text: string) => void; onCancel: () => void }) {
  const [answer, setAnswer] = useState("");
  const [attempted, setAttempted] = useState(false);
  const valid = Boolean(answer.trim());

  return (
    <form
      className="custom-answer-composer"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (valid) onSubmit(answer.trim());
      }}
    >
      <label htmlFor="custom-answer">Say it your way</label>
      <textarea
        id="custom-answer"
        autoFocus
        maxLength={CUSTOM_ANSWER_MAX_LENGTH}
        rows={3}
        placeholder="What fits better?"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
      />
      {attempted && !valid ? <p className="input-error">Give me a few words to follow.</p> : null}
      <div className="custom-actions">
        <button type="button" className="quiet-action" onClick={onCancel}>Back to the three</button>
        <button type="submit" className="primary-action">Use this answer</button>
      </div>
    </form>
  );
}

