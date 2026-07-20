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

export const FIELD_COLUMN_COUNT = 12;
export const FIELD_ROW_COUNT = 11;
export const FIELD_START_ROW = Math.floor(FIELD_ROW_COUNT / 2);
export const FIELD_WIDTH = 222;
export const FIELD_HEIGHT = 150;

const xForColumn = (column: number) => 12 + column * 18;
const yForRow = (row: number) => 10 + row * 13;
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
      y: yForRow(row),
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

export function getCellSlot(id: string) {
  const slot = CELL_SLOTS.find((candidate) => candidate.id === id);
  if (!slot) throw new Error(`Unknown cell slot: ${id}.`);
  return slot;
}
