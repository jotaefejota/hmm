import { z } from "zod";
import { roundPayloadSchema, summaryPayloadSchema } from "../../shared/ai-contract";

const scenarioSchema = z.object({
  id: z.string().min(1),
  dilemma: z.string().min(1),
  demoAnswerIndexes: z.array(z.number().int().min(0).max(2)).max(5),
  rounds: z.array(roundPayloadSchema).length(5),
  summary: summaryPayloadSchema,
});

const mockDatasetSchema = z.object({
  contractVersion: z.literal("1"),
  scenarios: z.tuple([scenarioSchema, scenarioSchema]),
});

export const TEAM_LEAD_DILEMMA =
  "Should I accept a team-lead role if it means less hands-on creative work?";

export const mockDataset = mockDatasetSchema.parse({
  contractVersion: "1",
  scenarios: [
    {
      id: "team-lead-demo",
      dilemma: TEAM_LEAD_DILEMMA,
      demoAnswerIndexes: [0, 0, 0, 0],
      rounds: [
        {
          kind: "round",
          question: "What makes the role appealing right now?",
          answers: ["I want more influence", "I’m ready to grow", "The recognition matters"],
          transition: "Let’s start with what pulls you toward it.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "What are you most reluctant to give up?",
          answers: ["Making things myself", "Control of my time", "Being close to the work"],
          transition: "So influence matters.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "If hands-on work were protected, how would the role feel?",
          answers: ["Much more appealing", "Still too managerial", "I’m not sure yet"],
          transition: "That sounds like more than a task preference.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "What would you need to know before saying yes?",
          answers: ["Whether the role is flexible", "How success is measured", "Who would support me"],
          transition: "Hmm… then the role itself may not be the problem.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "If flexibility is limited, what would you want to protect most?",
          answers: ["One hands-on day", "A six-month trial", "The option to step back"],
          transition: "So flexibility is the missing fact.",
          suggestEnding: true,
        },
      ],
      summary: {
        kind: "summary",
        direction: "You seem open to the team-lead role—if it can preserve meaningful hands-on work.",
        reasons: [
          "You want broader influence.",
          "Making things yourself is an important part of work you value.",
          "The role feels more appealing when creative time is protected.",
        ],
        doubts: [
          "Whether the role is genuinely flexible in practice.",
          "How much hands-on time can realistically be protected.",
        ],
        nextStep: "Ask whether the role can preserve one protected day each week for hands-on work before deciding.",
      },
    },
    {
      id: "generic-fallback",
      dilemma: "{user dilemma}",
      demoAnswerIndexes: [],
      rounds: [
        {
          kind: "round",
          question: "What matters most to you about this?",
          answers: ["What I might gain", "What I might lose", "What feels unfinished"],
          transition: "Let’s begin with what has weight.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "What makes the choice difficult?",
          answers: ["Both paths matter", "I’m missing information", "I’m afraid of regret"],
          transition: "There may be a tension worth naming.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "Which part of this could you test first?",
          answers: ["A small first step", "One conversation", "A time-limited trial"],
          transition: "A smaller test could make this less abstract.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "What would make the choice clearer?",
          answers: ["One missing fact", "A firmer boundary", "A little more time"],
          transition: "Hmm… clarity may depend on one concrete thing.",
          suggestEnding: false,
        },
        {
          kind: "round",
          question: "What is the smallest useful move from here?",
          answers: ["Ask one question", "Try a small version", "Name what I won’t trade"],
          transition: "There is enough here to choose a next step.",
          suggestEnding: true,
        },
      ],
      summary: {
        kind: "summary",
        direction: "You seem to be looking for a way forward that tests the decision before turning it into a final commitment.",
        reasons: [
          "You have identified what carries the most weight.",
          "A small experiment feels more useful than more abstract debate.",
        ],
        doubts: ["One important consequence or missing fact is still untested."],
        nextStep: "Choose one small, reversible action that would give you useful information before committing.",
      },
    },
  ],
});

export type MockScenario = (typeof mockDataset.scenarios)[number];

