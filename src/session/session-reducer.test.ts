import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { sessionReducer } from "./session-reducer";
import { initialSessionState } from "./session-types";

describe("sessionReducer", () => {
  it("moves through welcome, entry, generation, and first round", () => {
    const entering = sessionReducer(initialSessionState, { type: "OPEN_ENTRY" });
    const generating = sessionReducer(entering, { type: "SUBMIT_DILEMMA", dilemma: "  A real question?  " });
    const ready = sessionReducer(generating, { type: "ROUND_LOADED", round: mockDataset.scenarios[0].rounds[0] });

    expect(entering.phase).toBe("entering");
    expect(generating).toMatchObject({ phase: "generating-round", dilemma: "A real question?" });
    expect(ready).toMatchObject({ phase: "round-ready", dataSource: "mock" });
  });

  it("rejects empty and duplicate submissions", () => {
    const entering = sessionReducer(initialSessionState, { type: "OPEN_ENTRY" });
    expect(sessionReducer(entering, { type: "SUBMIT_DILEMMA", dilemma: "   " })).toBe(entering);

    const generating = sessionReducer(entering, { type: "SUBMIT_DILEMMA", dilemma: "A question" });
    expect(sessionReducer(generating, { type: "SUBMIT_DILEMMA", dilemma: "Another" })).toBe(generating);
  });
});

