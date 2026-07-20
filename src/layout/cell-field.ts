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
export const FIELD_ROW_COUNT = 13;
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

export function rowAfterChoices(choiceIndices: readonly (0 | 1 | 2)[]) {
  return choiceIndices.reduce((row, choiceIndex) => row + choiceDelta(choiceIndex), FIELD_START_ROW);
}

export function getQuestionCellId(roundNumber: number, priorChoices: readonly (0 | 1 | 2)[]) {
  const column = roundNumber * 2 - 1;
  const row = rowAfterChoices(priorChoices);
  return idFor(column, row);
}

export function getSuggestionCellIds(roundNumber: number, priorChoices: readonly (0 | 1 | 2)[]) {
  const questionRow = rowAfterChoices(priorChoices);
  const column = roundNumber * 2;
  return [
    idFor(column, questionRow - 1),
    idFor(column, questionRow),
    idFor(column, questionRow + 1),
  ] as const;
}

export function getHistoryAnswerCellId(
  history: readonly { round: number; choiceIndex: 0 | 1 | 2 }[],
  stepIndex: number,
) {
  if (stepIndex < 0 || stepIndex >= history.length) {
    throw new Error(`History step out of range: ${stepIndex}.`);
  }
  const priorChoices = history.slice(0, stepIndex).map((step) => step.choiceIndex);
  const step = history[stepIndex];
  return getSuggestionCellIds(step.round, priorChoices)[step.choiceIndex];
}

export function getCellSlot(id: string) {
  const slot = CELL_SLOTS.find((candidate) => candidate.id === id);
  if (!slot) throw new Error(`Unknown cell slot: ${id}.`);
  return slot;
}

/** Euclidean distance between two cell centres in world units. */
export function cellDistance(a: CellSlot, b: CellSlot) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
