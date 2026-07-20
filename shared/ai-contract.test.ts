import { describe, expect, it } from "vitest";
import { discoveryPayloadSchema } from "./ai-contract";

const lens = (theme: string, question: string) => ({
  theme,
  question,
  answers: ["What I gain", "What I lose", "What stays open"],
});
const validDiscovery = {
  kind: "discovery",
  lenses: [lens("What matters?", "What matters most?"), lens("What changes?", "What would really change?")],
  fortune: "What would become clearer if this choice were reversible?",
  transition: "Two angles seem useful.",
  suggestEnding: false,
};

describe("discoveryPayloadSchema", () => {
  it("accepts exactly two lenses with three answers each", () => {
    const parsed = discoveryPayloadSchema.parse(validDiscovery);
    expect(parsed.lenses).toHaveLength(2);
    expect(parsed.lenses.every((item) => item.answers.length === 3)).toBe(true);
  });

  it("rejects the wrong lens count", () => {
    expect(() => discoveryPayloadSchema.parse({ ...validDiscovery, lenses: [validDiscovery.lenses[0]] })).toThrow();
  });

  it("rejects duplicate themes, questions, and answers", () => {
    expect(() => discoveryPayloadSchema.parse({ ...validDiscovery, lenses: [validDiscovery.lenses[0], validDiscovery.lenses[0]] })).toThrow();
    expect(() => discoveryPayloadSchema.parse({ ...validDiscovery, lenses: [{ ...validDiscovery.lenses[0], answers: ["Same", "Same", "Different"] }, validDiscovery.lenses[1]] })).toThrow();
  });
});
