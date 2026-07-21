import { describe, expect, it } from "vitest";
import { mockDataset } from "../content/mock-dataset";
import { buildChatGptPrompt } from "./chatgpt-handoff";

describe("buildChatGptPrompt", () => {
  it("includes the dilemma, ordered path, and summary sections without an extra instruction", () => {
    const scenario = mockDataset.scenarios[0];
    const history = scenario.demoAnswerIndexes.map((answerIndex, index) => ({
      round: index + 1,
      lensTheme: scenario.discoveries[index].lenses[scenario.demoLensIndexes[index]].theme,
      lensIndex: scenario.demoLensIndexes[index] as 0 | 1,
      question: scenario.discoveries[index].lenses[scenario.demoLensIndexes[index]].question,
      answer: scenario.discoveries[index].lenses[scenario.demoLensIndexes[index]].answers[answerIndex],
      answerSource: "suggested" as const,
      choiceIndex: answerIndex as 0 | 1 | 2,
    }));
    const prompt = buildChatGptPrompt(scenario.dilemma, history, scenario.summary);

    expect(prompt).toContain(scenario.dilemma);
    expect(prompt).toContain(history[0].question);
    expect(prompt).toContain(history[0].answer);
    expect(prompt).toContain(scenario.summary.direction);
    expect(prompt).toContain(scenario.summary.nextStep);
    expect(prompt).not.toContain("Continue as a curious thinking companion");
    expect(prompt.indexOf(history[0].answer)).toBeLessThan(prompt.indexOf(history[1].answer));
  });
});
