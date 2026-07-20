import type { RoundPayload } from "../../shared/ai-contract";

export type CanvasNodePosition = {
  id: string;
  x: number;
  y: number;
  shape: 0 | 1 | 2 | 3;
};

export type CanvasEdge = {
  id: string;
  from: CanvasNodePosition;
  to: CanvasNodePosition;
};

const positions = {
  dilemma: { id: "dilemma", x: 28, y: 75, shape: 2 },
  question: { id: "question-1", x: 53, y: 50, shape: 0 },
  suggestions: [
    { id: "suggestion-1-1", x: 76, y: 23, shape: 1 },
    { id: "suggestion-1-2", x: 82, y: 50, shape: 3 },
    { id: "suggestion-1-3", x: 75, y: 78, shape: 2 },
  ] satisfies CanvasNodePosition[],
} as const;

export function projectFirstRound(round: RoundPayload) {
  const nodes = {
    dilemma: positions.dilemma,
    question: positions.question,
    suggestions: positions.suggestions.map((position, index) => ({
      ...position,
      text: round.answers[index],
    })),
  };

  const edges: CanvasEdge[] = [
    { id: "edge-dilemma-question-1", from: nodes.dilemma, to: nodes.question },
    ...nodes.suggestions.map((suggestion) => ({
      id: `edge-question-1-${suggestion.id}`,
      from: nodes.question,
      to: suggestion,
    })),
  ];

  return { nodes, edges };
}

export type FirstRoundProjection = ReturnType<typeof projectFirstRound>;
