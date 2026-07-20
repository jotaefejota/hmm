import { describe, expect, it } from "vitest";
import { CELL_SLOTS } from "./cell-field";
import { geometryForCell } from "./cell-geometry";

describe("geometryForCell", () => {
  it("keeps the reflection lens pressure footprint aligned with its rendered scale", () => {
    const geometry = geometryForCell(CELL_SLOTS[0], {
      cellId: CELL_SLOTS[0].id,
      semanticId: "finish-4",
      kind: "finish",
      status: "active",
      text: "What is taking shape?",
      label: "Reflection lens",
      age: 0,
      interactive: true,
    });

    expect(geometry.scale).toBe(2.73);
    expect(geometry.aspectRatio).toBe(1.365);
  });
});
