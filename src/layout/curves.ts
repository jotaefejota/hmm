import type { CanvasEdge } from "./projectCanvas";
import type { CellPositionMap } from "./pressure-layout";

const hashDirection = (id: string) =>
  [...id].reduce((total, character) => total + character.charCodeAt(0), 0) % 2 === 0 ? 1 : -1;

export function edgePath(edge: CanvasEdge, positions?: CellPositionMap) {
  const from = positions?.get(edge.from.id) ?? edge.from;
  const to = positions?.get(edge.to.id) ?? edge.to;
  const midpointX = (from.x + to.x) / 2;
  const midpointY = (from.y + to.y) / 2;
  const bend = hashDirection(edge.id) * 2.4;
  return `M ${from.x} ${from.y} Q ${midpointX} ${midpointY + bend} ${to.x} ${to.y}`;
}
