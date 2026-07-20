import { forceCollide, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import { CELL_DIAMETER, CELL_PITCH, type CellSlot } from "./cell-field";
import { geometryForCell } from "./cell-geometry";
import type { CanvasProjection } from "./projectCanvas";

export type CellPosition = { x: number; y: number };
export type CellPositionMap = ReadonlyMap<string, CellPosition>;

type PressureNode = SimulationNodeDatum & {
  id: string;
  homeX: number;
  homeY: number;
  radius: number;
  anchorStrength: number;
};

const LOCAL_PRESSURE_RADIUS = CELL_PITCH * 4.6;
const SETTLE_TICKS = 72;

function authoredPosition(slot: CellSlot): CellPosition {
  return { x: slot.x + slot.offsetX, y: slot.y + slot.offsetY };
}

function physicsFor(slot: CellSlot, projection: CanvasProjection) {
  const item = projection.occupancy.find((candidate) => candidate.cellId === slot.id);
  const geometry = geometryForCell(slot, item);
  const radius = (CELL_DIAMETER * geometry.scale * Math.max(geometry.aspectRatio, 1 / geometry.aspectRatio)) / 2;
  const anchorStrength = item?.kind === "question" && item.status === "active"
    ? 0.2
    : item?.status === "selected"
      ? 0.16
      : item
        ? 0.12
        : 0.055;
  return { radius, anchorStrength };
}

/**
 * A deterministic, finite collision pass. It has no timer and no ownership of
 * semantic state: it merely settles rendered positions near the current focus.
 */
export function settleLocalPressure(projection: CanvasProjection): CellPositionMap {
  const positions = new Map(projection.cells.map((slot) => [slot.id, authoredPosition(slot)]));
  const focusSlot = projection.cells.find((slot) => slot.id === projection.focusCellId);
  if (!focusSlot) return positions;

  const focus = authoredPosition(focusSlot);
  const localSlots = projection.cells.filter((slot) => {
    const position = authoredPosition(slot);
    return Math.hypot(position.x - focus.x, position.y - focus.y) <= LOCAL_PRESSURE_RADIUS;
  });
  const nodes: PressureNode[] = localSlots.map((slot) => {
    const position = authoredPosition(slot);
    const physics = physicsFor(slot, projection);
    return {
      id: slot.id,
      homeX: position.x,
      homeY: position.y,
      x: position.x,
      y: position.y,
      radius: physics.radius,
      anchorStrength: physics.anchorStrength,
    };
  });

  const simulation = forceSimulation(nodes)
    .force("home-x", forceX<PressureNode>((node) => node.homeX).strength((node) => node.anchorStrength))
    .force("home-y", forceY<PressureNode>((node) => node.homeY).strength((node) => node.anchorStrength))
    .force("collide", forceCollide<PressureNode>((node) => node.radius + 0.18).strength(0.82).iterations(3))
    .alpha(0.9)
    .alphaDecay(0.045)
    .velocityDecay(0.58)
    .stop();

  for (let tick = 0; tick < SETTLE_TICKS; tick += 1) simulation.tick();

  nodes.forEach((node) => positions.set(node.id, { x: node.x ?? node.homeX, y: node.y ?? node.homeY }));
  return positions;
}
