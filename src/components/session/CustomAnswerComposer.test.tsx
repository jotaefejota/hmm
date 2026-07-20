import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomAnswerComposer } from "./CustomAnswerComposer";

describe("CustomAnswerComposer", () => {
  it("rejects empty text and submits one trimmed custom answer", () => {
    const onSubmit = vi.fn();
    render(<CustomAnswerComposer onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Use this answer" }));
    expect(screen.getByText("Give me a few words to follow.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Say it your way"), { target: { value: "  The chance to mentor  " } });
    fireEvent.click(screen.getByRole("button", { name: "Use this answer" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith("The chance to mentor");
  });
});

