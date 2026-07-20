import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockDataset } from "../../content/mock-dataset";
import { ResultLens } from "./ResultLens";

describe("ResultLens", () => {
  it("renders every summary section and confirms restart", () => {
    const summary = mockDataset.scenarios[0].summary;
    const onRestart = vi.fn();
    render(<ResultLens summary={summary} onRestart={onRestart} />);

    expect(screen.getByRole("heading", { name: summary.direction })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is pulling you there" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is still unresolved" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "One next step" })).toBeInTheDocument();
    for (const reason of summary.reasons) expect(screen.getByText(reason)).toBeInTheDocument();
    for (const doubt of summary.doubts) expect(screen.getByText(doubt)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(onRestart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, start over" }));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});

