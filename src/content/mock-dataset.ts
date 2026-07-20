import { z } from "zod";
import { discoveryPayloadSchema, summaryPayloadSchema } from "../../shared/ai-contract";

const scenarioSchema = z.object({
  id: z.string().min(1),
  dilemma: z.string().min(1),
  demoLensIndexes: z.array(z.number().int().min(0).max(1)).max(5),
  demoAnswerIndexes: z.array(z.number().int().min(0).max(2)).max(5),
  discoveries: z.array(discoveryPayloadSchema).length(5),
  summary: summaryPayloadSchema,
});

const mockDatasetSchema = z.object({
  contractVersion: z.literal("2"),
  scenarios: z.tuple([scenarioSchema, scenarioSchema]),
});

const discovery = (
  transition: string,
  fortune: string,
  suggestEnding: boolean,
  first: [string, string, [string, string, string]],
  second: [string, string, [string, string, string]],
) => ({
  kind: "discovery" as const,
  lenses: [
    { theme: first[0], question: first[1], answers: first[2] },
    { theme: second[0], question: second[1], answers: second[2] },
  ],
  fortune,
  transition,
  suggestEnding,
});

export const TEAM_LEAD_DILEMMA =
  "Should I accept a team-lead role if it means less hands-on creative work?";

export const mockDataset = mockDatasetSchema.parse({
  contractVersion: "2",
  scenarios: [
    {
      id: "team-lead-demo",
      dilemma: TEAM_LEAD_DILEMMA,
      demoLensIndexes: [0, 0, 0, 0],
      demoAnswerIndexes: [0, 0, 0, 0],
      discoveries: [
        discovery("Two angles seem worth opening.", "Would you want the title if nobody else knew you had it?", false,
          ["What pulls you?", "What makes the role appealing right now?", ["I want more influence", "I’m ready to grow", "The recognition matters"]],
          ["What might shift?", "What could the role change about work you enjoy now?", ["My creative time", "My independence", "My daily rhythm"]]),
        discovery("Let’s follow what carries weight.", "Which loss would still matter after the novelty of the role wears off?", false,
          ["What might you lose?", "What are you most reluctant to give up?", ["Making things myself", "Control of my time", "Being close to the work"]],
          ["What might you gain?", "What could become possible with more responsibility?", ["A stronger voice", "Helping others grow", "A wider perspective"]]),
        discovery("There are two useful ways into that.", "Could leadership become another form of making, rather than its replacement?", false,
          ["What could be protected?", "If hands-on work were protected, how would the role feel?", ["Much more appealing", "Still too managerial", "I’m not sure yet"]],
          ["What is non-negotiable?", "Which part of creative work would you refuse to lose?", ["Making key decisions", "Time to prototype", "Direct craft practice"]]),
        discovery("The missing clarity may be practical.", "What promise about creative time would you actually trust six months from now?", false,
          ["What do you need to know?", "What would you need to know before saying yes?", ["Whether the role is flexible", "How success is measured", "Who would support me"]],
          ["What could you test?", "What small test would make the role less abstract?", ["Shadow the role", "Lead one project", "Try it for a month"]]),
        discovery("One last angle may sharpen the next step.", "If the role cannot bend, what does declining it protect?", true,
          ["What must be protected?", "If flexibility is limited, what would you want to protect most?", ["One hands-on day", "A six-month trial", "The option to step back"]],
          ["What would make it fair?", "What condition would make the trade-off feel worthwhile?", ["Clear authority", "Protected creative time", "A review point"]]),
      ],
      summary: {
        kind: "summary",
        direction: "You seem open to the team-lead role—if it can preserve meaningful hands-on work.",
        reasons: ["You want broader influence.", "Making things yourself is an important part of work you value.", "The role feels more appealing when creative time is protected."],
        doubts: ["Whether the role is genuinely flexible in practice.", "How much hands-on time can realistically be protected."],
        nextStep: "Ask whether the role can preserve one protected day each week for hands-on work before deciding.",
      },
    },
    {
      id: "generic-fallback",
      dilemma: "{user dilemma}",
      demoLensIndexes: [],
      demoAnswerIndexes: [],
      discoveries: [
        discovery("Choose the angle that has more weight.", "If nobody expected an answer today, what would become easier to notice?", false,
          ["What matters?", "What matters most to you about this?", ["What I might gain", "What I might lose", "What feels unfinished"]],
          ["What changes?", "What would really change if you chose this?", ["My daily life", "My relationships", "How I see myself"]]),
        discovery("There may be a tension worth naming.", "Which discomfort belongs to the choice, and which belongs only to uncertainty?", false,
          ["What makes it hard?", "What makes the choice difficult?", ["Both paths matter", "I’m missing information", "I’m afraid of regret"]],
          ["What feels risky?", "Which consequence feels hardest to accept?", ["Losing an option", "Disappointing someone", "Being wrong"]]),
        discovery("A smaller experiment could help.", "What evidence would surprise the version of you already leaning one way?", false,
          ["What could you test?", "Which part of this could you test first?", ["A small first step", "One conversation", "A time-limited trial"]],
          ["What could you learn?", "What missing information would change the decision?", ["The real cost", "How it feels", "What others expect"]]),
        discovery("Clarity may depend on one concrete thing.", "What are you treating as permanent that may only be difficult to reverse?", false,
          ["What would clarify it?", "What would make the choice clearer?", ["One missing fact", "A firmer boundary", "A little more time"]],
          ["What needs a boundary?", "What would you need to protect whichever way you choose?", ["My time", "My values", "A way back"]]),
        discovery("There is enough here for a next step.", "What would a useful decision look like if certainty were not required?", true,
          ["What can move now?", "What is the smallest useful move from here?", ["Ask one question", "Try a small version", "Name what I won’t trade"]],
          ["What can wait?", "Which part does not need to be decided today?", ["The final commitment", "Every detail", "Other people’s reactions"]]),
      ],
      summary: {
        kind: "summary",
        direction: "You seem to be looking for a way forward that tests the decision before turning it into a final commitment.",
        reasons: ["You have identified what carries the most weight.", "A small experiment feels more useful than more abstract debate."],
        doubts: ["One important consequence or missing fact is still untested."],
        nextStep: "Choose one small, reversible action that would give you useful information before committing.",
      },
    },
  ],
});

export type MockScenario = (typeof mockDataset.scenarios)[number];
