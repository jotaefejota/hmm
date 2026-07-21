import type { SummaryPayload } from "../../shared/ai-contract";
import type { ReflectionStep } from "../session/session-types";

const CHATGPT_URL = "https://chatgpt.com/";

export function buildChatGptPrompt(
  dilemma: string,
  history: ReflectionStep[],
  summary: SummaryPayload,
): string {
  const path = history
    .map((step, index) => `${index + 1}. ${step.question} → ${step.answer}`)
    .join("\n");
  const reasons = summary.reasons.map((reason) => `- ${reason}`).join("\n");
  const doubts = summary.doubts.map((doubt) => `- ${doubt}`).join("\n");

  return [
    "I used Hmm… to think through this question:",
    `“${dilemma}”`,
    "",
    "The path I followed:",
    path,
    "",
    "What seems to be emerging:",
    summary.direction,
    "",
    "Main reasons:",
    reasons,
    "",
    "Still unresolved:",
    doubts,
    "",
    "Possible next step:",
    summary.nextStep,
  ].join("\n");
}

export type HandoffResult =
  | { status: "copied"; prompt: string }
  | { status: "manual"; prompt: string };

export async function handoffToChatGpt(
  dilemma: string,
  history: ReflectionStep[],
  summary: SummaryPayload,
): Promise<HandoffResult> {
  const prompt = buildChatGptPrompt(dilemma, history, summary);
  const tab = window.open(CHATGPT_URL, "_blank", "noopener,noreferrer");

  try {
    await navigator.clipboard.writeText(prompt);
    return { status: "copied", prompt };
  } catch {
    if (tab) tab.close();
    return { status: "manual", prompt };
  }
}
