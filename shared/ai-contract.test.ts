import { describe, expect, it } from "vitest";
import { roundPayloadSchema } from "./ai-contract";

const validRound = {
  kind: "round",
  question: "What matters most?",
  answers: ["What I gain", "What I lose", "What stays open"],
  transition: "Let’s begin with what has weight.",
  suggestEnding: false,
};

describe("roundPayloadSchema", () => {
  it("accepts exactly three distinct answers", () => {
    expect(roundPayloadSchema.parse(validRound).answers).toHaveLength(3);
  });

  it("rejects the wrong answer count", () => {
    expect(() => roundPayloadSchema.parse({ ...validRound, answers: ["One", "Two"] })).toThrow();
  });

  it("rejects duplicate answers", () => {
    expect(() => roundPayloadSchema.parse({ ...validRound, answers: ["Same", "Same", "Different"] })).toThrow();
  });
});

