import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockDataset } from "../../content/mock-dataset";
import { ResultLens, ResultLensSkeleton } from "./ResultLens";

describe("ResultLens", () => {
  it("shows a result-shaped skeleton while the summary is gathering", () => {
    render(<ResultLensSkeleton />);
    expect(screen.getByLabelText("Gathering your thoughts")).toHaveAttribute("aria-busy", "true");
    expect(document.querySelectorAll(".skeleton-line")).toHaveLength(9);
  });

  it("renders every summary section and confirms restart", () => {
    const summary = mockDataset.scenarios[0].summary;
    const onRestart = vi.fn();
    const onContinueExploring = vi.fn();
    render(
      <ResultLens
        summary={summary}
        dilemma={mockDataset.scenarios[0].dilemma}
        history={[]}
        canExtend
        onContinueExploring={onContinueExploring}
        onRestart={onRestart}
      />,
    );

    expect(screen.getByRole("heading", { name: summary.direction })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Why" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next step" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue in ChatGPT" })).toBeInTheDocument();
    for (const reason of summary.reasons) expect(screen.getByText(reason)).toBeInTheDocument();
    for (const doubt of summary.doubts) expect(screen.getByText(doubt)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue exploring" }));
    expect(onContinueExploring).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(onRestart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, start again" }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("keeps the continuation action visible but unavailable after the extension has been used", () => {
    render(
      <ResultLens
        summary={mockDataset.scenarios[0].summary}
        dilemma={mockDataset.scenarios[0].dilemma}
        history={[]}
        canExtend={false}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Continue exploring" })).toBeDisabled();
  });

  it("includes only the fortune angles the user opened", () => {
    render(
      <ResultLens
        summary={mockDataset.scenarios[0].summary}
        dilemma={mockDataset.scenarios[0].dilemma}
        history={[]}
        fortunes={[{ round: 2, text: "What would be easier to test than to decide?" }]}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Fresh angles" })).toBeInTheDocument();
    expect(screen.getByText("✦ What would be easier to test than to decide?")).toBeInTheDocument();
  });

  it("uses the same action to return to a prepared core round", () => {
    const onDismiss = vi.fn();
    render(
      <ResultLens
        summary={mockDataset.scenarios[0].summary}
        dilemma={mockDataset.scenarios[0].dilemma}
        history={[]}
        canContinue
        onDismiss={onDismiss}
        onRestart={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue exploring" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
