import type { RoundRequest, SummaryRequest } from "../../shared/ai-contract";
import { roundPayloadSchema, summaryPayloadSchema } from "../../shared/ai-contract";
import { mockDataset, TEAM_LEAD_DILEMMA } from "../content/mock-dataset";
import type { ContentResult, ReflectionProvider } from "./reflection-provider";

const findScenario = (dilemma: string) =>
  mockDataset.scenarios.find((scenario) => scenario.dilemma === dilemma) ??
  mockDataset.scenarios.find((scenario) => scenario.id === "generic-fallback")!;

const followsCuratedPath = (input: SummaryRequest) => {
  const curated = mockDataset.scenarios[0];
  if (input.dilemma !== curated.dilemma || input.history.length < curated.demoAnswerIndexes.length) return false;
  return curated.demoAnswerIndexes.every((answerIndex, index) =>
    input.history[index]?.answer === curated.rounds[index]?.answers[answerIndex],
  );
};

export class MockReflectionProvider implements ReflectionProvider {
  async getRound(input: RoundRequest, signal?: AbortSignal): Promise<ContentResult<ReturnType<typeof roundPayloadSchema.parse>>> {
    signal?.throwIfAborted();
    if (input.requestMode === "extension") {
      return {
        source: "mock",
        data: roundPayloadSchema.parse({
          kind: "round",
          question: "What would make that remaining doubt feel clearer?",
          answers: ["A concrete conversation", "A small time-boxed test", "More information first"],
          transition: "Let’s look at that doubt once more.",
          suggestEnding: false,
        }),
      };
    }
    const scenario = findScenario(input.dilemma);
    const index = Math.min(input.roundNumber - 1, scenario.rounds.length - 1);
    return { source: "mock", data: roundPayloadSchema.parse(scenario.rounds[index]) };
  }

  async getSummary(input: SummaryRequest, signal?: AbortSignal): Promise<ContentResult<ReturnType<typeof summaryPayloadSchema.parse>>> {
    signal?.throwIfAborted();
    const scenario = followsCuratedPath(input)
      ? mockDataset.scenarios[0]
      : mockDataset.scenarios[1];
    return { source: "mock", data: summaryPayloadSchema.parse(scenario.summary) };
  }
}

export const reflectionProvider: ReflectionProvider = new MockReflectionProvider();
export { TEAM_LEAD_DILEMMA };
