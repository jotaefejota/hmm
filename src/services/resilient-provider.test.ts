import { describe, expect, it, vi } from "vitest";
import { TEAM_LEAD_DILEMMA } from "../content/mock-dataset";
import { ResilientReflectionProvider } from "./resilient-provider";
import { ReflectionProviderError } from "./reflection-provider";

const roundRequest = {
  contractVersion: "2" as const,
  kind: "round" as const,
  dilemma: TEAM_LEAD_DILEMMA,
  roundNumber: 1 as const,
  requestMode: "core" as const,
  maxCoreRounds: 5 as const,
  history: [],
  focus: null,
};

describe("ResilientReflectionProvider", () => {
  it("makes no network request in mock mode", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = new ResilientReflectionProvider("mock");
    const result = await provider.getRound(roundRequest);
    expect(result.source).toBe("mock");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("falls back to mock content in auto mode after a live failure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const provider = new ResilientReflectionProvider("auto");
    const result = await provider.getRound(roundRequest);
    expect(result.source).toBe("mock");
    expect(result.notice?.message).toMatch(/prepared reflection/i);
    expect(fetchSpy).toHaveBeenCalledOnce();
    fetchSpy.mockRestore();
  });

  it("does not fall back on refusal", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        kind: "error",
        code: "AI_REFUSAL",
        message: "This topic needs a different kind of support.",
        retryable: false,
        fallbackAvailable: false,
      }), { status: 422, headers: { "Content-Type": "application/json" } }),
    );
    const provider = new ResilientReflectionProvider("auto");
    await expect(provider.getRound(roundRequest)).rejects.toBeInstanceOf(ReflectionProviderError);
    fetchSpy.mockRestore();
  });
});
