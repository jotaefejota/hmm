import { describe, expect, it } from "vitest";
import { getCellSlot } from "./cell-field";
import { getSelectionConsolidation } from "./selection-consolidation";

describe("selection consolidation", () => {
  it("pulls an answer a bounded distance toward the question", () => {
    const question = getCellSlot("cell-c1-r9");
    const answer = getCellSlot("cell-c2-r10");
    const consolidation = getSelectionConsolidation(question, answer);

    expect(Math.hypot(consolidation.answerTarget.x - question.x, consolidation.answerTarget.y - question.y))
      .toBeLessThan(Math.hypot(answer.x - question.x, answer.y - question.y));
    expect(Math.hypot(consolidation.answerPull.x, consolidation.answerPull.y)).toBeGreaterThan(0);
  });

  it("produces compatible closed paths for the membrane animation", () => {
    const consolidation = getSelectionConsolidation(getCellSlot("cell-c1-r9"), getCellSlot("cell-c2-r10"));

    expect(consolidation.startPath).toMatch(/^M /);
    expect(consolidation.consolidatedPath).toMatch(/^M /);
    expect(consolidation.startPath.match(/[MCZ]/g)).toEqual(consolidation.consolidatedPath.match(/[MCZ]/g));
  });
});
