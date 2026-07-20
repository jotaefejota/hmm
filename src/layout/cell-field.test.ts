import { describe, expect, it } from "vitest";
import {
  CELL_PITCH, CELL_SLOTS, FIELD_COLUMN_COUNT, FIELD_ROW_COUNT, FIELD_START_ROW,
  cellDistance, getCellSlot, getHistoryAnswerCellId, getLensCellIds, getQuestionCellId,
  getSuggestionCellIds, rowAfterSteps, type RouteStep,
} from "./cell-field";

describe("cell-field packed discovery world", () => {
  it("keeps a stable finite hex lattice", () => {
    expect(CELL_SLOTS).toHaveLength(FIELD_COLUMN_COUNT * FIELD_ROW_COUNT);
    expect(new Set(CELL_SLOTS.map((slot) => slot.id)).size).toBe(CELL_SLOTS.length);
    const origin = getCellSlot(`cell-c0-r${FIELD_START_ROW}`);
    expect(cellDistance(origin, getCellSlot(`cell-c0-r${FIELD_START_ROW + 1}`))).toBeCloseTo(CELL_PITCH, 5);
    expect(cellDistance(origin, getCellSlot(`cell-c1-r${FIELD_START_ROW}`))).toBeCloseTo(CELL_PITCH, 5);
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

  it("maps committed history to its selected answer cell", () => {
    const history = [{ round: 1, lensIndex: 0 as const, choiceIndex: 0 as const }, { round: 2, lensIndex: 1 as const, choiceIndex: 2 as const }];
    expect(getHistoryAnswerCellId(history, 0)).toBe(getSuggestionCellIds(1, [], 0)[0]);
    expect(getHistoryAnswerCellId(history, 1)).toBe(getSuggestionCellIds(2, history.slice(0, 1), 1)[2]);
  });
});
