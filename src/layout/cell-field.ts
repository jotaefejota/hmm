export type CellShape = 0 | 1 | 2 | 3;

export type CellSlot = {
  id: string;
  column: number;
  row: number;
  x: number;
  y: number;
  size: "medium";
  shape: CellShape;
  role: "cell";
};

/**
 * Centre-to-centre distance for kissing neighbours.
 * All world coordinates are expressed in viewport-width units so packing is isotropic.
 */
export const CELL_PITCH = 10.5;
/** Empty-cell diameter as a fraction of pitch (small membrane gap). */
export const CELL_MEMBRANE_GAP = 0.96;
export const CELL_DIAMETER = CELL_PITCH * CELL_MEMBRANE_GAP;

export const FIELD_COLUMN_COUNT = 14;
export const FIELD_ROW_COUNT = 21;
export const FIELD_START_ROW = Math.floor(FIELD_ROW_COUNT / 2);

const COL_STEP = CELL_PITCH * (Math.sqrt(3) / 2);
const ROW_STEP = CELL_PITCH;
const ORIGIN_X = 8;
const ORIGIN_Y = 10;

export const FIELD_WIDTH =
  ORIGIN_X * 2 + (FIELD_COLUMN_COUNT - 1) * COL_STEP + CELL_PITCH;
export const FIELD_HEIGHT =
  ORIGIN_Y * 2 + (FIELD_ROW_COUNT - 1) * ROW_STEP + CELL_PITCH + ROW_STEP / 2;

/** Ratio of empty-cell diameter to field width — used by CSS. */
export const CELL_SIZE_RATIO = CELL_DIAMETER / FIELD_WIDTH;

const xForColumn = (column: number) => ORIGIN_X + column * COL_STEP;
const yForCell = (column: number, row: number) =>
  ORIGIN_Y + row * ROW_STEP + (column % 2 === 1 ? ROW_STEP / 2 : 0);
const idFor = (column: number, row: number) => `cell-c${column}-r${row}`;

export const CELL_SLOTS: readonly CellSlot[] = Array.from(
  { length: FIELD_COLUMN_COUNT * FIELD_ROW_COUNT },
  (_, index) => {
    const column = Math.floor(index / FIELD_ROW_COUNT);
    const row = index % FIELD_ROW_COUNT;
    return {
      id: idFor(column, row),
      column,
      row,
      x: xForColumn(column),
      y: yForCell(column, row),
      size: "medium",
      shape: (column * 3 + row) % 4 as CellShape,
      role: "cell",
    };
  },
);

export const DILEMMA_CELL_ID = idFor(0, FIELD_START_ROW);

export function choiceDelta(choiceIndex: 0 | 1 | 2) {
  return choiceIndex - 1;
}

export function lensDelta(lensIndex: 0 | 1) {
  return lensIndex === 0 ? -1 : 1;
}

export type RouteStep = { lensIndex: 0 | 1; choiceIndex: 0 | 1 | 2 };

export function rowAfterSteps(steps: readonly RouteStep[]) {
  return steps.reduce(
    (row, step) => row + lensDelta(step.lensIndex) + choiceDelta(step.choiceIndex),
    FIELD_START_ROW,
  );
}

export function getLensCellIds(roundNumber: number, priorSteps: readonly RouteStep[]) {
  const baseRow = rowAfterSteps(priorSteps);
  const column = roundNumber * 2 - 1;
  return [idFor(column, baseRow - 1), idFor(column, baseRow + 1)] as const;
}

export function getFortuneCellId(roundNumber: number, priorSteps: readonly RouteStep[]) {
  const baseRow = rowAfterSteps(priorSteps);
  const row = baseRow <= FIELD_START_ROW ? baseRow + 3 : baseRow - 3;
  return idFor(roundNumber * 2 - 1, row);
}

export function getQuestionCellId(roundNumber: number, priorSteps: readonly RouteStep[], lensIndex: 0 | 1) {
  return getLensCellIds(roundNumber, priorSteps)[lensIndex];
}

export function getSuggestionCellIds(roundNumber: number, priorSteps: readonly RouteStep[], lensIndex: 0 | 1) {
  const questionRow = rowAfterSteps(priorSteps) + lensDelta(lensIndex);
  const questionColumn = roundNumber * 2 - 1;
  const forwardColumn = questionColumn + 1;

  // The three answers form a touching fan around the opened lens instead of a
  // rigid column. The first option continues the lens's upward/downward bend;
  // the other two occupy the two forward hex neighbours.
  return lensIndex === 0
    ? [
        idFor(questionColumn, questionRow - 1),
        idFor(forwardColumn, questionRow),
        idFor(forwardColumn, questionRow + 1),
      ] as const
    : [
        idFor(forwardColumn, questionRow),
        idFor(forwardColumn, questionRow + 1),
        idFor(questionColumn, questionRow + 1),
      ] as const;
}

export function getHistoryCellId(
  history: readonly { round: number; lensIndex: 0 | 1; choiceIndex: 0 | 1 | 2 }[],
  stepIndex: number,
  focusKind: "question" | "answer" = "answer",
) {
  if (stepIndex < 0 || stepIndex >= history.length) {
    throw new Error(`History step out of range: ${stepIndex}.`);
  }
  const priorSteps = history.slice(0, stepIndex);
  const step = history[stepIndex];
  return focusKind === "question"
    ? getQuestionCellId(step.round, priorSteps, step.lensIndex)
    : getSuggestionCellIds(step.round, priorSteps, step.lensIndex)[step.choiceIndex];
}

export const getHistoryAnswerCellId = (
  history: readonly { round: number; lensIndex: 0 | 1; choiceIndex: 0 | 1 | 2 }[],
  stepIndex: number,
) => getHistoryCellId(history, stepIndex, "answer");

export function getCellSlot(id: string) {
  const slot = CELL_SLOTS.find((candidate) => candidate.id === id);
  if (!slot) throw new Error(`Unknown cell slot: ${id}.`);
  return slot;
}

/** Euclidean distance between two cell centres in world units. */
export function cellDistance(a: CellSlot, b: CellSlot) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
