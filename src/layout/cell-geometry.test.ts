import { describe, expect, it } from "vitest";
import { CELL_SLOTS } from "./cell-field";
import { geometryForCell } from "./cell-geometry";

describe("geometryForCell", () => {
  it("uses one five-cell-sized reflection bubble in the shared pressure layout", () => {
    const geometry = geometryForCell(CELL_SLOTS[0], {
      cellId: CELL_SLOTS[0].id,
      semanticId: "finish-4",
      kind: "finish",
      status: "active",
      text: "Discover",
      label: "Something is taking shape",
      age: 0,
      interactive: true,
    });

    expect(geometry.scale).toBe(2.17);
    expect(geometry.aspectRatio).toBe(1.06);
  });

  it("gives a settled decision more room than a normal answer", () => {
    const slot = CELL_SLOTS[0];
    const answer = geometryForCell(slot, { cellId: slot.id, semanticId: "answer-1", kind: "answer", status: "selected", text: "Answer", label: "You chose", age: 0, interactive: true });
    const decision = geometryForCell(slot, { cellId: slot.id, semanticId: "decision-1", kind: "decision", status: "selected", text: "Answer", label: "Settled choice", age: 0, interactive: true });
    expect(decision.scale).toBeGreaterThan(answer.scale);
  });

  it("gives the original dilemma the same settled footprint as a decision", () => {
    const slot = CELL_SLOTS[0];
    const dilemma = geometryForCell(slot, { cellId: slot.id, semanticId: "dilemma", kind: "dilemma", status: "previous", text: "Original thought", label: "You brought", age: 1, interactive: false });
    const decision = geometryForCell(slot, { cellId: slot.id, semanticId: "decision-1", kind: "decision", status: "selected", text: "Answer", label: "Settled choice", age: 0, interactive: true });
    expect(dilemma).toEqual(decision);
  });
});
