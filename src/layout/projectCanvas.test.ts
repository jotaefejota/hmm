import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { projectActiveRound } from "./projectCanvas";

describe("projectActiveRound", () => {
  it("returns stable unique coordinates and exactly three suggestions for every round", () => {
    for (const [index, round] of mockDataset.scenarios[0].rounds.entries()) {
      const first = projectActiveRound(round, index + 1, index > 0);
      const second = projectActiveRound(round, index + 1, index > 0);
      const allNodes = [first.nodes.dilemma, first.nodes.question, ...first.nodes.suggestions];

      expect(first).toEqual(second);
      expect(first.nodes.suggestions).toHaveLength(3);
      expect(new Set(allNodes.map((node) => node.id)).size).toBe(allNodes.length);
      expect(new Set(allNodes.map((node) => `${node.x}:${node.y}`)).size).toBe(allNodes.length);
      expect(first.edges).toHaveLength(4);
    }
  });
});

