import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProgressCard } from "./ProgressCard";

describe("ProgressCard", () => {
  it("returns to landing from either the Hmm mark or original dilemma", async () => {
    const user = userEvent.setup();
    const onReturnToLanding = vi.fn();
    render(
      <ProgressCard
        progress={{ dilemma: "Should I move closer to my friends?", completed: 1, status: "Exploring", isThinking: false, answers: ["I miss them"] }}
        onReturnToLanding={onReturnToLanding}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start again with this thought" }));
    await user.click(screen.getByRole("button", { name: "Should I move closer to my friends?" }));
    expect(onReturnToLanding).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Start again with this thought" }).querySelector("img")).toHaveAttribute("src", expect.stringContaining("hmm-logo-transparent"));
  });
});
