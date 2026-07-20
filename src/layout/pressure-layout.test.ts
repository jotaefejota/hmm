import { describe, expect, it } from "vitest";
import type { CellSlot } from "./cell-field";
import { settleLocalPressure } from "./pressure-layout";
import type { CanvasProjection } from "./projectCanvas";

const slot = (id: string, x: number, y: number): CellSlot => ({
  id, x, y, column: 0, row: 0, size: "medium", footprint: "orb", scale: 1,
  aspectRatio: 1, offsetX: 0, offsetY: 0, shape: 0, role: "cell",
});

const pressureProjection = (): CanvasProjection => ({
  cells: [slot("left", 0, 0), slot("active", 10.5, 0), slot("right", 21, 0), slot("outer", 31.5, 0)],
  occupancy: [{
    cellId: "active", semanticId: "question-1", kind: "question", status: "active",
    text: "What matters?", label: "What matters", age: 0, interactive: false,
  }],
  edges: [],
  focusCellId: "active",
});

describe("settleLocalPressure", () => {
  it("settles a grown active node by propagating pressure through neighbours", () => {
    const positions = settleLocalPressure(pressureProjection());
    expect(positions.get("left")?.x).toBeLessThan(0);
    expect(positions.get("right")?.x).toBeGreaterThan(21);
    expect(positions.get("outer")?.x).toBeGreaterThan(31.5);
  });

  it("is deterministic for the same semantic projection", () => {
    const first = [...settleLocalPressure(pressureProjection()).entries()];
    const second = [...settleLocalPressure(pressureProjection()).entries()];
    expect(second).toEqual(first);
  });

  it("keeps the active question closer to home than the quiet cell it presses", () => {
    const projection = pressureProjection();
    projection.cells = [slot("active", 0, 0), slot("quiet", 10.5, 0), slot("outer", 21, 0)];
    projection.occupancy = [{
      cellId: "active", semanticId: "question-1", kind: "question", status: "active",
      text: "What matters?", label: "What matters", age: 0, interactive: false,
    }];
    projection.focusCellId = "active";

    const positions = settleLocalPressure(projection);
    const activeDistance = Math.abs((positions.get("active")?.x ?? 0) - 0);
    const quietDistance = Math.abs((positions.get("quiet")?.x ?? 10.5) - 10.5);
    expect(quietDistance).toBeGreaterThan(activeDistance);
  });
});
