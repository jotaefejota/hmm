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

export const CAMERA_DILEMMA = "Would a new camera help me get back into photography?";

export const mockDataset = mockDatasetSchema.parse({
  contractVersion: "2",
  scenarios: [
    {
      id: "camera-demo",
      dilemma: CAMERA_DILEMMA,
      demoLensIndexes: [0, 0, 0, 0],
      demoAnswerIndexes: [0, 0, 0, 0],
      discoveries: [
        discovery("Two angles seem worth opening.", "If a camera appeared tomorrow, what would you hope changed first?", false,
          ["What is missing?", "What feels furthest away from photography right now?", ["Having a camera ready", "Making time to shoot", "Knowing what to photograph"]],
          ["What would change?", "What would a new camera make easier?", ["Carry it everywhere", "Enjoy shooting again", "See in a new way"]]),
        discovery("Let’s follow what carries weight.", "Could the first useful photograph be imperfect and still count as returning?", false,
          ["What would bring you back?", "What would make taking photos feel possible this week?", ["A small outing", "A simple project", "A camera I enjoy using"]],
          ["What kind of camera?", "What quality would make you reach for it?", ["Small enough to carry", "Simple to use", "A joy to hold"]]),
        discovery("There are two useful ways into that.", "Sometimes the object is a threshold; sometimes it is a lovely detour.", false,
          ["What is the real barrier?", "When you picture your current camera, what gets in the way?", ["It feels cumbersome", "It no longer inspires me", "I barely know where it is"]],
          ["What is already there?", "What part of photography do you miss most?", ["Noticing light", "Walking with purpose", "Keeping small memories"]]),
        discovery("The missing clarity may be practical.", "A borrowed camera can reveal more than a week of comparing specifications.", false,
          ["What could you test?", "What would tell you whether new gear is the missing piece?", ["Rent one for a weekend", "Borrow one for a walk", "Take mine out first"]],
          ["What would be enough?", "What would make a camera feel like a companion rather than a purchase?", ["It comes with me", "I learn it quickly", "I want to make plans with it"]]),
        discovery("One last angle may sharpen the next step.", "The best next camera may be the one that creates a small ritual, not a bigger expectation.", true,
          ["What would you protect?", "If you bought one, what would keep it from becoming another unused object?", ["A weekly photo walk", "One small project", "A place by the door"]],
          ["What can wait?", "What does not need deciding before you begin shooting again?", ["The perfect model", "A serious commitment", "Other people’s opinions"]]),
      ],
      summary: {
        kind: "summary",
        direction: "You seem to want a camera that lowers the friction of taking photos and rekindles your curiosity—not simply newer gear.",
        reasons: ["Having a camera ready feels like a useful invitation to begin.", "You want the experience of using it to feel enjoyable again.", "A short real-world test matters more than comparing specifications."],
        doubts: ["Whether a new camera is the real barrier, rather than time or habit.", "Which size and feel would genuinely make you carry it."],
        nextStep: "Borrow or rent one camera for a weekend, then take one unplanned photo walk before deciding whether to buy.",
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
