import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TEAM_LEAD_DILEMMA } from "../../content/mock-dataset";
import { WelcomeSeed } from "./WelcomeSeed";

describe("WelcomeSeed", () => {
  it("opens the prefilled demo dilemma and submits with Enter", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <WelcomeSeed phase="welcome" onOpen={onOpen} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole("button", { name: /start with a thought/i }));
    expect(onOpen).toHaveBeenCalledOnce();

    rerender(<WelcomeSeed phase="entering" onOpen={onOpen} onCancel={vi.fn()} onSubmit={onSubmit} />);
    const input = screen.getByLabelText(/your question or dilemma/i);
    expect(input).toHaveValue(TEAM_LEAD_DILEMMA);
    await user.type(input, "{Enter}");
    expect(onSubmit).toHaveBeenCalledWith(TEAM_LEAD_DILEMMA);
  });

  it("does not submit whitespace", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<WelcomeSeed phase="entering" onOpen={vi.fn()} onCancel={vi.fn()} onSubmit={onSubmit} />);
    const input = screen.getByLabelText(/your question or dilemma/i);
    await user.clear(input);
    await user.type(input, "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /think it through/i })).toBeDisabled();
  });
});

