import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockDataset } from "../../content/mock-dataset";
import { ResultLens } from "./ResultLens";

describe("ResultLens", () => {
  it("renders every summary section and confirms restart", () => {
    const summary = mockDataset.scenarios[0].summary;
    const onRestart = vi.fn();
    const onExploreDoubt = vi.fn();
    render(
      <ResultLens
        summary={summary}
        dilemma={mockDataset.scenarios[0].dilemma}
        history={[]}
        canExtend
        onExploreDoubt={onExploreDoubt}
        onRestart={onRestart}
      />,
    );

    expect(screen.getByRole("heading", { name: summary.direction })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is pulling you there" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is still unresolved" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "One next step" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue in ChatGPT" })).toBeInTheDocument();
    for (const reason of summary.reasons) expect(screen.getByText(reason)).toBeInTheDocument();
    for (const doubt of summary.doubts) expect(screen.getByText(doubt)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Explore one remaining doubt" }));
    expect(onExploreDoubt).toHaveBeenCalledWith(summary.doubts[0]);

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(onRestart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, start over" }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("hides the extension action after it has been used", () => {
    render(
      <ResultLens
        summary={mockDataset.scenarios[0].summary}
        dilemma={mockDataset.scenarios[0].dilemma}
        history={[]}
        canExtend={false}
        onExploreDoubt={vi.fn()}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Explore one remaining doubt" })).not.toBeInTheDocument();
  });
});
