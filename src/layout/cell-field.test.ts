import { describe, expect, it } from "vitest";
import {
  CELL_PITCH,
  CELL_SLOTS,
  FIELD_COLUMN_COUNT,
  FIELD_ROW_COUNT,
  FIELD_START_ROW,
  cellDistance,
  getCellSlot,
  getHistoryAnswerCellId,
  getQuestionCellId,
  getSuggestionCellIds,
  rowAfterChoices,
} from "./cell-field";

describe("cell-field packed soup", () => {
  it("keeps a stable finite lattice with unique slot ids", () => {
    expect(CELL_SLOTS).toHaveLength(FIELD_COLUMN_COUNT * FIELD_ROW_COUNT);
    expect(new Set(CELL_SLOTS.map((slot) => slot.id)).size).toBe(CELL_SLOTS.length);
  });

  it("places odd columns on a hex offset so neighbours sit near pitch distance", () => {
    const origin = getCellSlot(`cell-c0-r${FIELD_START_ROW}`);
    const sameColumnNeighbour = getCellSlot(`cell-c0-r${FIELD_START_ROW + 1}`);
    const hexNeighbour = getCellSlot(`cell-c1-r${FIELD_START_ROW}`);

    expect(cellDistance(origin, sameColumnNeighbour)).toBeCloseTo(CELL_PITCH, 5);
    expect(cellDistance(origin, hexNeighbour)).toBeCloseTo(CELL_PITCH, 5);
  });

  it("keeps extreme five-round routes inside the authored lattice", () => {
    const upperChoices = [0, 0, 0, 0, 0] as const;
    const lowerChoices = [2, 2, 2, 2, 2] as const;

    expect(rowAfterChoices(upperChoices.slice(0, 4))).toBeGreaterThanOrEqual(0);
    expect(rowAfterChoices(lowerChoices.slice(0, 4))).toBeLessThan(FIELD_ROW_COUNT);

    for (const choices of [upperChoices, lowerChoices]) {
      for (let round = 1; round <= 5; round += 1) {
        const prior = choices.slice(0, round - 1) as (0 | 1 | 2)[];
        expect(() => getCellSlot(getQuestionCellId(round, prior))).not.toThrow();
        for (const suggestionId of getSuggestionCellIds(round, prior)) {
          expect(() => getCellSlot(suggestionId)).not.toThrow();
        }
      }
    }
  });

  it("diverges upper and lower suggestion routes", () => {
    const middle = getSuggestionCellIds(1, []);
    expect(middle[0]).not.toBe(middle[2]);
    expect(getQuestionCellId(2, [0])).not.toBe(getQuestionCellId(2, [2]));
  });

  it("maps committed history indexes to marked answer cells", () => {
    const history = [
      { round: 1, choiceIndex: 0 as const },
      { round: 2, choiceIndex: 2 as const },
    ];
    expect(getHistoryAnswerCellId(history, 0)).toBe(getSuggestionCellIds(1, [])[0]);
    expect(getHistoryAnswerCellId(history, 1)).toBe(getSuggestionCellIds(2, [0])[2]);
  });
});
