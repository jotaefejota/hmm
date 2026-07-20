import type { CanvasEdge } from "./projectCanvas";

const hashDirection = (id: string) =>
  [...id].reduce((total, character) => total + character.charCodeAt(0), 0) % 2 === 0 ? 1 : -1;

export function edgePath(edge: CanvasEdge) {
  const midpointX = (edge.from.x + edge.to.x) / 2;
  const midpointY = (edge.from.y + edge.to.y) / 2;
  const bend = hashDirection(edge.id) * 2.4;
  return `M ${edge.from.x} ${edge.from.y} Q ${midpointX} ${midpointY + bend} ${edge.to.x} ${edge.to.y}`;
}

