import type { RoundRequest, SummaryRequest } from "../../shared/ai-contract";
import { roundPayloadSchema, summaryPayloadSchema } from "../../shared/ai-contract";
import { mockDataset, TEAM_LEAD_DILEMMA } from "../content/mock-dataset";
import type { ReflectionProvider } from "./reflection-provider";

const findScenario = (dilemma: string) =>
  mockDataset.scenarios.find((scenario) => scenario.dilemma === dilemma) ??
  mockDataset.scenarios.find((scenario) => scenario.id === "generic-fallback")!;

export class MockReflectionProvider implements ReflectionProvider {
  async getRound(input: RoundRequest, signal?: AbortSignal) {
    signal?.throwIfAborted();
    const scenario = findScenario(input.dilemma);
    const index = Math.min(input.roundNumber - 1, scenario.rounds.length - 1);
    return roundPayloadSchema.parse(scenario.rounds[index]);
  }

  async getSummary(input: SummaryRequest, signal?: AbortSignal) {
    signal?.throwIfAborted();
    return summaryPayloadSchema.parse(findScenario(input.dilemma).summary);
  }
}

export const reflectionProvider: ReflectionProvider = new MockReflectionProvider();
export { TEAM_LEAD_DILEMMA };
