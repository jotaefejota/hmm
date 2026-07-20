import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { projectFirstRound } from "./projectCanvas";

describe("projectFirstRound", () => {
  it("returns stable unique coordinates and exactly three suggestions", () => {
    const round = mockDataset.scenarios[0].rounds[0];
    const first = projectFirstRound(round);
    const second = projectFirstRound(round);
    const allNodes = [first.nodes.dilemma, first.nodes.question, ...first.nodes.suggestions];

    expect(first).toEqual(second);
    expect(first.nodes.suggestions).toHaveLength(3);
    expect(new Set(allNodes.map((node) => node.id)).size).toBe(allNodes.length);
    expect(new Set(allNodes.map((node) => `${node.x}:${node.y}`)).size).toBe(allNodes.length);
    expect(first.edges).toHaveLength(4);
  });
});

