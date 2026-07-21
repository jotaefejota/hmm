import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CAMERA_DILEMMA } from "../../content/mock-dataset";
import { WelcomeSeed } from "./WelcomeSeed";

describe("WelcomeSeed", () => {
  it("opens the prefilled demo dilemma and submits with Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <WelcomeSeed phase="entering" onSubmit={onSubmit} />,
    );

    expect(screen.getByRole("heading", { name: "Clarify your next move" })).toBeVisible();
    expect(screen.queryByText("A small place to think")).not.toBeInTheDocument();
    expect(screen.queryByText("Bring one question. We’ll follow it for a few turns.")).not.toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Your thought" });
    expect(input).toHaveValue(CAMERA_DILEMMA);
    await user.type(input, "{Enter}");
    expect(onSubmit).toHaveBeenCalledWith(CAMERA_DILEMMA);
  });

  it("does not submit whitespace", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<WelcomeSeed phase="entering" onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "Your thought" });
    await user.clear(input);
    await user.type(input, "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Hmm…" })).toBeDisabled();
  });
});
