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
  // The seed is the user's first settled thought: it deserves the same room
  // and typographic hierarchy as every later settled decision.
  if (item.kind === "dilemma") return { footprint: "shell", scale: 1.72, aspectRatio: 1.08 };
  if (item.kind === "lens") return item.lensIndex === 0
    ? { footprint: "orb", scale: 1.08, aspectRatio: 1 }
    : { footprint: "capsule", scale: 1.04, aspectRatio: 1.18 };
  if (item.kind === "preview") return { footprint: "orb", scale: 1.02, aspectRatio: 1 };
  if (item.kind === "question") return item.status === "active"
    ? { footprint: "shell", scale: 1.36, aspectRatio: 1.08 }
    : { footprint: "shell", scale: 1.06, aspectRatio: 1.04 };
  if (item.kind === "suggestion") {
    const selectedLift = item.status === "selected" ? 1.14 : 1;
    if (item.optionIndex === 0) return { footprint: "capsule", scale: 0.94 * selectedLift, aspectRatio: 1.18 };
    if (item.optionIndex === 1) return { footprint: "orb", scale: 0.98 * selectedLift, aspectRatio: 1 };
    return { footprint: "pebble", scale: 0.94 * selectedLift, aspectRatio: 0.9 };
  }
  if (item.kind === "custom") return { footprint: "orb", scale: 0.98, aspectRatio: 1 };
  if (item.kind === "answer") return { footprint: "capsule", scale: 1.04, aspectRatio: 1.1 };
  if (item.kind === "decision") return { footprint: "shell", scale: 1.72, aspectRatio: 1.08 };
  if (item.kind === "fortune") return { footprint: "capsule", scale: 1.16, aspectRatio: 1.24 };
  // Approximately five standard-cell areas: visually distinct, but still a
  // single participant in the same pressure and membrane system as every node.
  if (item.kind === "finish") return { footprint: "shell", scale: 2.17, aspectRatio: 1.06 };
  if (item.kind === "continue") return { footprint: "orb", scale: 1.1, aspectRatio: 1 };
  return { footprint: slot.footprint, scale: slot.scale, aspectRatio: slot.aspectRatio };
}
