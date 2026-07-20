import { describe, expect, it } from "vitest";
import { mockDataset, TEAM_LEAD_DILEMMA } from "./mock-dataset";

describe("mock dataset", () => {
  it("contains a complete curated and generic five-round path", () => {
    expect(mockDataset.scenarios).toHaveLength(2);
    expect(mockDataset.scenarios[0].dilemma).toBe(TEAM_LEAD_DILEMMA);
    for (const scenario of mockDataset.scenarios) {
      expect(scenario.rounds).toHaveLength(5);
      for (const round of scenario.rounds) expect(round.answers).toHaveLength(3);
    }
  });
});

