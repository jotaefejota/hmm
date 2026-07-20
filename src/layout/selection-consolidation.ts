import type { CellSlot } from "./cell-field";

export type SelectionConsolidation = {
  answerTarget: { x: number; y: number };
  answerPull: { x: number; y: number };
  startPath: string;
  consolidatedPath: string;
};

const rounded = (value: number) => Number(value.toFixed(3));

/**
 * A deterministic, visual-only local merge. It never changes semantic node
 * ownership or stored lattice coordinates. Both paths use the same command
 * sequence so Motion can interpolate them safely.
 */
const membranePath = (
  question: { x: number; y: number },
  answer: { x: number; y: number },
  questionRadius: number,
  answerRadius: number,
) => {
  const dx = answer.x - question.x;
  const dy = answer.y - question.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / distance;
  const ny = dx / distance;
  const qTop = { x: question.x + nx * questionRadius, y: question.y + ny * questionRadius };
  const aTop = { x: answer.x + nx * answerRadius, y: answer.y + ny * answerRadius };
  const aBottom = { x: answer.x - nx * answerRadius, y: answer.y - ny * answerRadius };
  const qBottom = { x: question.x - nx * questionRadius, y: question.y - ny * questionRadius };
  const curve = Math.min(distance * 0.42, 5.4);

  return [
    `M ${rounded(qTop.x)} ${rounded(qTop.y)}`,
    `C ${rounded(qTop.x + dx * 0.34 + nx * curve)} ${rounded(qTop.y + dy * 0.34 + ny * curve)} ${rounded(aTop.x - dx * 0.34 + nx * curve)} ${rounded(aTop.y - dy * 0.34 + ny * curve)} ${rounded(aTop.x)} ${rounded(aTop.y)}`,
    `C ${rounded(aTop.x + dx * 0.26)} ${rounded(aTop.y + dy * 0.26)} ${rounded(aBottom.x + dx * 0.26)} ${rounded(aBottom.y + dy * 0.26)} ${rounded(aBottom.x)} ${rounded(aBottom.y)}`,
    `C ${rounded(aBottom.x - dx * 0.34 - nx * curve)} ${rounded(aBottom.y - dy * 0.34 - ny * curve)} ${rounded(qBottom.x + dx * 0.34 - nx * curve)} ${rounded(qBottom.y + dy * 0.34 - ny * curve)} ${rounded(qBottom.x)} ${rounded(qBottom.y)}`,
    `C ${rounded(qBottom.x - dx * 0.26)} ${rounded(qBottom.y - dy * 0.26)} ${rounded(qTop.x - dx * 0.26)} ${rounded(qTop.y - dy * 0.26)} ${rounded(qTop.x)} ${rounded(qTop.y)} Z`,
  ].join(" ");
};

export function getSelectionConsolidation(question: CellSlot, answer: CellSlot): SelectionConsolidation {
  const pullRatio = 0.18;
  const answerTarget = {
    x: answer.x + (question.x - answer.x) * pullRatio,
    y: answer.y + (question.y - answer.y) * pullRatio,
  };

  return {
    answerTarget,
    answerPull: { x: answerTarget.x - answer.x, y: answerTarget.y - answer.y },
    startPath: membranePath(question, answer, 4.65, 4.25),
    consolidatedPath: membranePath(question, answerTarget, 5.15, 4.65),
  };
}
