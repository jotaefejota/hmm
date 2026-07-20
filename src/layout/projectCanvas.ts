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
  status: "origin" | "active";
};

const suggestionPositions = [
  { x: 77, y: 23, shape: 1 },
  { x: 83, y: 50, shape: 3 },
  { x: 76, y: 78, shape: 2 },
] as const;

export function projectActiveRound(round: RoundPayload, roundNumber: number, hasHistory: boolean) {
  const dilemma: CanvasNodePosition = { id: "dilemma", x: 28, y: 75, shape: 2 };
  const trailAnchor: CanvasNodePosition = { id: "trail-anchor", x: 35, y: 76, shape: 0 };
  const question: CanvasNodePosition = { id: `question-${roundNumber}`, x: 54, y: 50, shape: roundNumber % 4 as 0 | 1 | 2 | 3 };
  const suggestions = suggestionPositions.map((position, index) => ({
    ...position,
    id: `suggestion-${roundNumber}-${index + 1}`,
    text: round.answers[index],
  }));
  const origin = hasHistory ? trailAnchor : dilemma;
  const edges: CanvasEdge[] = [
    { id: `edge-${origin.id}-${question.id}`, from: origin, to: question, status: "origin" },
    ...suggestions.map((suggestion) => ({
      id: `edge-${question.id}-${suggestion.id}`,
      from: question,
      to: suggestion,
      status: "active" as const,
    })),
  ];

  return { nodes: { dilemma, question, suggestions }, edges };
}

export type ActiveRoundProjection = ReturnType<typeof projectActiveRound>;
