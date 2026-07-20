import type { CanvasOccupancy } from "./projectCanvas";
import type { CellFootprint, CellSlot } from "./cell-field";

export type CellGeometry = {
  footprint: CellFootprint;
  scale: number;
  aspectRatio: number;
};

/**
 * Semantic geometry stays derived from canvas occupancy. The reducer never
 * stores visual size, which lets the pressure layout remain a pure view.
 */
export function geometryForCell(slot: CellSlot, item: CanvasOccupancy | undefined): CellGeometry {
  if (!item) return { footprint: slot.footprint, scale: slot.scale, aspectRatio: slot.aspectRatio };
  if (item.kind === "dilemma") return { footprint: "pebble", scale: 1.05, aspectRatio: 0.98 };
  if (item.kind === "lens") return item.lensIndex === 0
    ? { footprint: "orb", scale: 1.08, aspectRatio: 1 }
    : { footprint: "capsule", scale: 1.04, aspectRatio: 1.18 };
  if (item.kind === "question") return item.status === "active"
    ? { footprint: "shell", scale: 1.36, aspectRatio: 1.08 }
    : { footprint: "shell", scale: 1.06, aspectRatio: 1.04 };
  if (item.kind === "suggestion") {
    const selectedLift = item.status === "selected" ? 1.14 : 1;
    if (item.optionIndex === 0) return { footprint: "capsule", scale: 0.94 * selectedLift, aspectRatio: 1.18 };
    if (item.optionIndex === 1) return { footprint: "orb", scale: 0.98 * selectedLift, aspectRatio: 1 };
    return { footprint: "pebble", scale: 0.94 * selectedLift, aspectRatio: 0.9 };
  }
  if (item.kind === "answer") return { footprint: "capsule", scale: 1.04, aspectRatio: 1.1 };
  if (item.kind === "fortune") return { footprint: "capsule", scale: 0.9, aspectRatio: 1.24 };
  if (item.kind === "finish") return { footprint: "shell", scale: 2.3, aspectRatio: 1.365 };
  if (item.kind === "continue") return { footprint: "orb", scale: 1.1, aspectRatio: 1 };
  return { footprint: slot.footprint, scale: slot.scale, aspectRatio: slot.aspectRatio };
}
