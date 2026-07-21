import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MockReflectionProvider } from "../services/mock-provider";
import { reflectionProvider } from "../services/resilient-provider";
import { ReflectionProviderError } from "../services/reflection-provider";
import { App } from "./App";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  window.history.replaceState({}, "", "/");
});

describe("App interaction guards", () => {
  it("starts only one next-round request when a possibility is clicked rapidly", async () => {
    vi.useFakeTimers();
    const mockProvider = new MockReflectionProvider();
    const roundSpy = vi.spyOn(reflectionProvider, "getRound").mockImplementation(
      mockProvider.getRound.bind(mockProvider),
    );
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Think it through/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    fireEvent.click(screen.getByRole("button", { name: "Explore What is missing?" }));
    const possibility = screen.getByRole("button", { name: "Possibility 1: Having a camera ready" });
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

    fireEvent.click(screen.getByRole("button", { name: /Think it through/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    expect(screen.getByRole("alert")).toHaveTextContent("This topic needs a different kind of support.");
    expect(screen.getByRole("complementary", { name: "Reflection progress" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with prepared questions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start over" })).toBeVisible();
  });

  it("keeps context visible and retries a recoverable failure", async () => {
    vi.useFakeTimers();
    const mockProvider = new MockReflectionProvider();
    vi.spyOn(reflectionProvider, "getRound")
      .mockRejectedValueOnce(new ReflectionProviderError({
        kind: "error",
        code: "AI_TIMEOUT",
        message: "The live response took too long.",
        retryable: true,
        fallbackAvailable: true,
      }))
      .mockImplementation(mockProvider.getRound.bind(mockProvider));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Think it through/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    expect(screen.getByRole("alert")).toHaveTextContent("Your path is still here.");
    expect(screen.getAllByText("Would a new camera help me get back into photography?").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Continue with prepared questions" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    expect(screen.getByRole("button", { name: "Explore What is missing?" })).toBeInTheDocument();
  });
});
