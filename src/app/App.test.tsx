import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MockReflectionProvider } from "../services/mock-provider";
import { reflectionProvider } from "../services/resilient-provider";
import { ReflectionProviderError } from "../services/reflection-provider";
import { App } from "./App";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("App interaction guards", () => {
  it("starts only one next-round request when a possibility is clicked rapidly", async () => {
    vi.useFakeTimers();
    const mockProvider = new MockReflectionProvider();
    const roundSpy = vi.spyOn(reflectionProvider, "getRound").mockImplementation(
      mockProvider.getRound.bind(mockProvider),
    );
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start with a thought" }));
    fireEvent.click(screen.getByRole("button", { name: /Think it through/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    const possibility = screen.getByRole("button", { name: "Possibility 1: I want more influence" });
    fireEvent.click(possibility);
    fireEvent.click(possibility);

    expect(roundSpy).toHaveBeenCalledTimes(2);
    expect(possibility).toBeDisabled();
  });

  it("renders a reducer-owned boundary state instead of throwing a refused request", async () => {
    vi.useFakeTimers();
    vi.spyOn(reflectionProvider, "getRound").mockRejectedValueOnce(new ReflectionProviderError({
      kind: "error",
      code: "AI_REFUSAL",
      message: "This topic needs a different kind of support.",
      retryable: false,
      fallbackAvailable: false,
    }));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start with a thought" }));
    fireEvent.click(screen.getByRole("button", { name: /Think it through/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    expect(screen.getByRole("alert")).toHaveTextContent("This topic needs a different kind of support.");
    expect(screen.getByRole("button", { name: "Start over" })).toBeVisible();
  });
});
