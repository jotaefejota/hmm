export type CellShape = 0 | 1 | 2 | 3;
export type CellFootprint = "seed" | "pebble" | "orb" | "shell" | "capsule";
export type CellRegion = "upper" | "centre" | "lower";

export type CellSlot = {
  id: string;
  column: number;
  row: number;
  x: number;
  y: number;
  size: "medium";
  region: CellRegion;
  footprint: CellFootprint;
  scale: number;
  aspectRatio: number;
  offsetX: number;
  offsetY: number;
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
type AtlasProfile = {
  footprint: CellFootprint;
  scale: number;
  aspectRatio: number;
  offsetX: number;
  offsetY: number;
};

const REGION_ATLAS: Record<CellRegion, readonly AtlasProfile[]> = {
  upper: [
    { footprint: "seed", scale: 0.76, aspectRatio: 0.92, offsetX: -1.08, offsetY: -0.7 },
    { footprint: "pebble", scale: 0.88, aspectRatio: 0.86, offsetX: 0.52, offsetY: 0.9 },
    { footprint: "shell", scale: 1.05, aspectRatio: 0.94, offsetX: 0.94, offsetY: -0.44 },
    { footprint: "orb", scale: 0.82, aspectRatio: 1.02, offsetX: -0.48, offsetY: 0.54 },
    { footprint: "capsule", scale: 0.96, aspectRatio: 0.84, offsetX: 0.28, offsetY: -1.02 },
  ],
  centre: [
    { footprint: "seed", scale: 0.8, aspectRatio: 1, offsetX: -1.04, offsetY: 0.38 },
    { footprint: "pebble", scale: 0.9, aspectRatio: 0.92, offsetX: 0.62, offsetY: -0.9 },
    { footprint: "orb", scale: 0.98, aspectRatio: 1.08, offsetX: 0.86, offsetY: 0.76 },
    { footprint: "seed", scale: 0.84, aspectRatio: 0.96, offsetX: -0.68, offsetY: -0.3 },
    { footprint: "capsule", scale: 1.04, aspectRatio: 1.22, offsetX: 0.38, offsetY: -1.04 },
  ],
  lower: [
    { footprint: "orb", scale: 0.9, aspectRatio: 1.14, offsetX: -0.94, offsetY: 0.62 },
    { footprint: "capsule", scale: 1.08, aspectRatio: 1.28, offsetX: 0.76, offsetY: -0.62 },
    { footprint: "pebble", scale: 0.82, aspectRatio: 1.06, offsetX: 0.42, offsetY: 1.02 },
    { footprint: "shell", scale: 1.02, aspectRatio: 1.16, offsetX: -0.76, offsetY: -0.38 },
    { footprint: "seed", scale: 0.78, aspectRatio: 0.94, offsetX: 0.18, offsetY: 0.84 },
  ],
};

export function regionForRow(row: number): CellRegion {
  if (row < FIELD_START_ROW) return "upper";
  if (row > FIELD_START_ROW) return "lower";
  return "centre";
}

export const CELL_SLOTS: readonly CellSlot[] = Array.from(
  { length: FIELD_COLUMN_COUNT * FIELD_ROW_COUNT },
  (_, index) => {
    const column = Math.floor(index / FIELD_ROW_COUNT);
    const row = index % FIELD_ROW_COUNT;
    const region = regionForRow(row);
    const profiles = REGION_ATLAS[region];
    const profile = profiles[(column * 7 + row * 3) % profiles.length];
    return {
      id: idFor(column, row),
      column,
      row,
      x: xForColumn(column),
      y: yForCell(column, row),
      size: "medium",
      region,
      footprint: profile.footprint,
      scale: profile.scale,
      aspectRatio: profile.aspectRatio,
      offsetX: profile.offsetX,
      offsetY: profile.offsetY,
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
  if (roundNumber === 1) {
    return [idFor(1, FIELD_START_ROW - 1), idFor(1, FIELD_START_ROW + 1)] as const;
  }

  const lastStep = priorSteps[priorSteps.length - 1];
  if (!lastStep) throw new Error(`Round ${roundNumber} needs a prior route step.`);
  const lastAnswer = getCellSlot(
    getSuggestionCellIds(roundNumber - 1, priorSteps.slice(0, -1), lastStep.lensIndex)[lastStep.choiceIndex],
  );
  const forwardColumn = lastAnswer.column + 1;
  const [upperRow, lowerRow] = lastAnswer.column % 2 === 0
    ? [lastAnswer.row - 1, lastAnswer.row]
    : [lastAnswer.row, lastAnswer.row + 1];

  // A new pair of lenses grows from the two forward hex-neighbours of the
  // selected answer. Both cells physically touch that answer while the next
  // choice still determines the following bend through its answer position.
  return [idFor(forwardColumn, upperRow), idFor(forwardColumn, lowerRow)] as const;

}

export function getFortuneCellId(roundNumber: number, priorSteps: readonly RouteStep[]) {
  const [upperLensId, lowerLensId] = getLensCellIds(roundNumber, priorSteps);
  const upperLens = getCellSlot(upperLensId);
  const lowerLens = getCellSlot(lowerLensId);
  const centreRow = (upperLens.row + lowerLens.row) / 2;
  const row = centreRow <= FIELD_START_ROW ? centreRow + 3 : centreRow - 3;
  return idFor(upperLens.column, row);
}

export function getQuestionCellId(roundNumber: number, priorSteps: readonly RouteStep[], lensIndex: 0 | 1) {
  return getLensCellIds(roundNumber, priorSteps)[lensIndex];
}

export function getSuggestionCellIds(roundNumber: number, priorSteps: readonly RouteStep[], lensIndex: 0 | 1) {
  const question = getCellSlot(getQuestionCellId(roundNumber, priorSteps, lensIndex));
  const questionRow = question.row;
  const questionColumn = question.column;
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

/** A temporary reflection lens always touches the most recently committed answer. */
export function getFinishCellId(
  history: readonly { round: number; lensIndex: 0 | 1; choiceIndex: 0 | 1 | 2 }[],
) {
  if (history.length === 0) throw new Error("A finish lens needs a committed answer.");
  const answer = getCellSlot(getHistoryAnswerCellId(history, history.length - 1));
  const column = answer.column % 2 === 0 ? answer.column + 1 : answer.column + 2;
  const row = Math.min(answer.row, FIELD_ROW_COUNT - 2);
  return idFor(column, row);
}

/** The exact quiet-cell diamond covered by the four-cell reflection membrane. */
export function getFinishFootprintCellIds(
  history: readonly { round: number; lensIndex: 0 | 1; choiceIndex: 0 | 1 | 2 }[],
) {
  const left = getCellSlot(getFinishCellId(history));
  return [
    left.id,
    idFor(left.column + 1, left.row),
    idFor(left.column + 1, left.row + 1),
    idFor(left.column + 2, left.row),
  ] as const;
}

/** The bypass bubble sits below the centre of the four-cell reflection lens. */
export function getContinueCellId(
  history: readonly { round: number; lensIndex: 0 | 1; choiceIndex: 0 | 1 | 2 }[],
) {
  if (history.length === 0) throw new Error("A continue bubble needs a committed answer.");
  const finish = getCellSlot(getFinishCellId(history));
  const rowOffset = finish.row <= FIELD_START_ROW ? 3 : -2;
  return idFor(finish.column + 1, finish.row + rowOffset);
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
