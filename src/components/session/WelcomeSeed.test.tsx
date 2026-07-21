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

  it("uses a supplied thought and can clear it in place", async () => {
    const user = userEvent.setup();
    render(<WelcomeSeed phase="entering" initialDilemma="Should I move closer to my friends?" onSubmit={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByRole("textbox", { name: "Your thought" })).toHaveValue("Should I move closer to my friends?");
    await user.click(screen.getByRole("button", { name: "Clear thought" }));
    expect(screen.getByRole("textbox", { name: "Your thought" })).toHaveValue("");
  });

  it("offers three rotating starter prompts that can fill the thought", async () => {
    const user = userEvent.setup();
    render(<WelcomeSeed phase="entering" onSubmit={vi.fn().mockResolvedValue(undefined)} />);
    const suggestions = screen.getByRole("group", { name: "Try a question" }).getElementsByTagName("button");
    expect(suggestions).toHaveLength(3);
    await user.click(suggestions[0]);
    expect(screen.getByRole("textbox", { name: "Your thought" })).toHaveValue(suggestions[0].textContent);
  });
});
