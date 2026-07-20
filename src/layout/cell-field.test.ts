import { describe, expect, it } from "vitest";
import {
  CELL_PITCH, CELL_SLOTS, FIELD_COLUMN_COUNT, FIELD_ROW_COUNT, FIELD_START_ROW,
  cellDistance, getCellSlot, getHistoryAnswerCellId, getLensCellIds, getQuestionCellId,
  getSuggestionCellIds, getFinishCellId, getFinishFootprintCellIds, getContinueCellId, rowAfterSteps, type RouteStep,
} from "./cell-field";

describe("cell-field packed discovery world", () => {
  it("keeps a stable finite hex lattice", () => {
    expect(CELL_SLOTS).toHaveLength(FIELD_COLUMN_COUNT * FIELD_ROW_COUNT);
    expect(new Set(CELL_SLOTS.map((slot) => slot.id)).size).toBe(CELL_SLOTS.length);
    const origin = getCellSlot(`cell-c0-r${FIELD_START_ROW}`);
    expect(cellDistance(origin, getCellSlot(`cell-c0-r${FIELD_START_ROW + 1}`))).toBeCloseTo(CELL_PITCH, 5);
    expect(cellDistance(origin, getCellSlot(`cell-c1-r${FIELD_START_ROW}`))).toBeCloseTo(CELL_PITCH, 5);
  });

  it("authors a varied but deterministic resting membrane field", () => {
    const footprints = new Set(CELL_SLOTS.map((slot) => slot.footprint));
    const scales = new Set(CELL_SLOTS.map((slot) => slot.scale));
    expect(footprints.size).toBeGreaterThan(3);
    expect(scales.size).toBeGreaterThan(3);
    expect(getCellSlot("cell-c3-r7")).toEqual(CELL_SLOTS.find((slot) => slot.id === "cell-c3-r7"));
  });

  it("keeps extreme five-round lens and answer routes legal", () => {
    const upper = Array.from({ length: 5 }, () => ({ lensIndex: 0, choiceIndex: 0 }) as const);
    const lower = Array.from({ length: 5 }, () => ({ lensIndex: 1, choiceIndex: 2 }) as const);
    expect(rowAfterSteps(upper)).toBeGreaterThanOrEqual(0);
    expect(rowAfterSteps(lower)).toBeLessThan(FIELD_ROW_COUNT);
    for (const route of [upper, lower]) {
      for (let round = 1; round <= 5; round += 1) {
        const prior = route.slice(0, round - 1) as RouteStep[];
        getLensCellIds(round, prior).forEach((id) => expect(() => getCellSlot(id)).not.toThrow());
        expect(() => getCellSlot(getQuestionCellId(round, prior, route[round - 1].lensIndex))).not.toThrow();
        getSuggestionCellIds(round, prior, route[round - 1].lensIndex).forEach((id) => expect(() => getCellSlot(id)).not.toThrow());
      }
    }
  });

  it("derives different routes from lens and answer choices", () => {
    expect(getQuestionCellId(1, [], 0)).not.toBe(getQuestionCellId(1, [], 1));
    expect(getQuestionCellId(2, [{ lensIndex: 0, choiceIndex: 0 }], 0))
      .not.toBe(getQuestionCellId(2, [{ lensIndex: 1, choiceIndex: 2 }], 0));
  });

  it("fans all three answers through cells touching the opened lens", () => {
    for (const lensIndex of [0, 1] as const) {
      const question = getCellSlot(getQuestionCellId(1, [], lensIndex));
      const answers = getSuggestionCellIds(1, [], lensIndex).map(getCellSlot);

      expect(new Set(answers.map((answer) => answer.id)).size).toBe(3);
      answers.forEach((answer) => {
        expect(cellDistance(question, answer)).toBeCloseTo(CELL_PITCH, 5);
      });

      const sameColumnAnswer = answers.find((answer) => answer.column === question.column);
      expect(sameColumnAnswer?.row).toBe(question.row + (lensIndex === 0 ? -1 : 1));
    }
  });

  it("maps committed history to its selected answer cell", () => {
    const history = [{ round: 1, lensIndex: 0 as const, choiceIndex: 0 as const }, { round: 2, lensIndex: 1 as const, choiceIndex: 2 as const }];
    expect(getHistoryAnswerCellId(history, 0)).toBe(getSuggestionCellIds(1, [], 0)[0]);
    expect(getHistoryAnswerCellId(history, 1)).toBe(getSuggestionCellIds(2, history.slice(0, 1), 1)[2]);
  });

  it("places the reflection lens beside, rather than over, the latest selected answer", () => {
    const history = [{ round: 1, lensIndex: 0 as const, choiceIndex: 1 as const }];
    const answer = getCellSlot(getHistoryAnswerCellId(history, 0));
    const finish = getCellSlot(getFinishCellId(history));
    expect(cellDistance(answer, finish)).toBeCloseTo(CELL_PITCH, 5);
  });

  it("keeps the continuation bubble inside the authored lattice on extreme routes", () => {
    const upper = Array.from({ length: 5 }, (_, index) => ({ round: index + 1, lensIndex: 0 as const, choiceIndex: 0 as const }));
    const lower = Array.from({ length: 5 }, (_, index) => ({ round: index + 1, lensIndex: 1 as const, choiceIndex: 2 as const }));
    [upper, lower].forEach((history) => expect(() => getCellSlot(getContinueCellId(history))).not.toThrow());
  });

  it("uses the exact left-middle-middle-right quiet-cell diamond for the reflection membrane", () => {
    const history = [{ round: 1, lensIndex: 0 as const, choiceIndex: 1 as const }];
    const [leftId, middleUpperId, middleLowerId, rightId] = getFinishFootprintCellIds(history);
    const left = getCellSlot(leftId);
    const middleUpper = getCellSlot(middleUpperId);
    const middleLower = getCellSlot(middleLowerId);
    const right = getCellSlot(rightId);
    expect(left.column).toBe(right.column - 2);
    expect(middleUpper.column).toBe(left.column + 1);
    expect(middleLower.column).toBe(middleUpper.column);
    expect(middleLower.row).toBe(middleUpper.row + 1);
    expect(cellDistance(left, middleUpper)).toBeCloseTo(CELL_PITCH, 5);
    expect(cellDistance(left, middleLower)).toBeCloseTo(CELL_PITCH, 5);
    expect(cellDistance(right, middleUpper)).toBeCloseTo(CELL_PITCH, 5);
    expect(cellDistance(right, middleLower)).toBeCloseTo(CELL_PITCH, 5);
  });
});
