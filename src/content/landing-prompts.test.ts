import { describe, expect, it } from "vitest";
import { LANDING_PROMPTS, pickLandingPrompts } from "./landing-prompts";

describe("landing prompts", () => {
  it("keeps a bank of 30 short prompts and selects three distinct invitations", () => {
    const prompts = pickLandingPrompts(3, () => 0.4);
    expect(LANDING_PROMPTS).toHaveLength(30);
    expect(prompts).toHaveLength(3);
    expect(new Set(prompts)).toHaveLength(3);
  });
});
