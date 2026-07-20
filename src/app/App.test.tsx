import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reflectionProvider } from "../services/resilient-provider";
import { App } from "./App";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("App interaction guards", () => {
  it("starts only one next-round request when a possibility is clicked rapidly", async () => {
    vi.useFakeTimers();
    const roundSpy = vi.spyOn(reflectionProvider, "getRound");
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
});

