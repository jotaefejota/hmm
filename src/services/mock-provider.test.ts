import { describe, expect, it } from "vitest";
import { MAX_CORE_ROUNDS } from "../../shared/limits";
import { TEAM_LEAD_DILEMMA } from "../content/mock-dataset";
import { MockReflectionProvider } from "./mock-provider";

describe("MockReflectionProvider", () => {
  it("returns the curated first round without a network request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = new MockReflectionProvider();
    const round = await provider.getRound({
      contractVersion: "1",
      kind: "round",
      dilemma: TEAM_LEAD_DILEMMA,
      roundNumber: 1,
      requestMode: "core",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: [],
      focus: null,
    });

    expect(round.question).toBe("What makes the role appealing right now?");
    expect(round.answers).toHaveLength(3);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("uses the generic path for another dilemma", async () => {
    const provider = new MockReflectionProvider();
    const round = await provider.getRound({
      contractVersion: "1",
      kind: "round",
      dilemma: "Should I move?",
      roundNumber: 1,
      requestMode: "core",
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: [],
      focus: null,
    });

    expect(round.question).toBe("What matters most to you about this?");
  });
});

