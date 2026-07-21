import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LANDING_PROMPTS } from "../../content/landing-prompts";
import { WelcomeSeed } from "./WelcomeSeed";

describe("WelcomeSeed", () => {
  it("opens a rotating starter dilemma and submits it with Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <WelcomeSeed phase="entering" onSubmit={onSubmit} />,
    );

    expect(screen.getByRole("heading", { name: "Clarify your next move" })).toBeVisible();
    expect(screen.queryByText("A small place to think")).not.toBeInTheDocument();
    expect(screen.queryByText("Bring one question. We’ll follow it for a few turns.")).not.toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Your thought" });
    expect(LANDING_PROMPTS).toContain((input as HTMLTextAreaElement).value);
    await user.type(input, "{Enter}");
    expect(onSubmit).toHaveBeenCalledWith((input as HTMLTextAreaElement).value);
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

  it("uses the Hmm logo in the submit action", () => {
    render(<WelcomeSeed phase="entering" onSubmit={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByRole("button", { name: "Hmm…" }).querySelector("img")).toHaveAttribute("src", expect.stringContaining("hmm-logo-transparent"));
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
    expect([...suggestions].map((suggestion) => suggestion.textContent)).not.toContain((screen.getByRole("textbox", { name: "Your thought" }) as HTMLTextAreaElement).value);
    await user.click(suggestions[0]);
    expect(screen.getByRole("textbox", { name: "Your thought" })).toHaveValue(suggestions[0].textContent);
  });
});
