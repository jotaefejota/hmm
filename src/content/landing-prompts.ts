export const LANDING_PROMPTS = [
  "Should I learn Korean?",
  "Can I learn skating at 40?",
  "Would yoga help me?",
  "Is a dog a good companion?",
  "Should I take a pottery class?",
  "Could I enjoy running?",
  "Would a garden calm me down?",
  "Should I try stand-up comedy?",
  "Is it time to learn to swim?",
  "Would a weekly hike suit me?",
  "Should I get back into drawing?",
  "Could I learn to DJ?",
  "Would a book club be good for me?",
  "Should I volunteer locally?",
  "Could I make bread every week?",
  "Would a cat fit my life?",
  "Should I try bouldering?",
  "Can I become a morning person?",
  "Would learning chess be fun?",
  "Should I take singing lessons?",
  "Could I travel solo this year?",
  "Would a new bike change my routine?",
  "Should I learn to cook properly?",
  "Could I make time for photography?",
  "Would a language exchange help me?",
  "Should I join a choir?",
  "Could I train for a 10K?",
  "Would dance classes suit me?",
  "Should I start writing again?",
  "Could a side project energise me?",
] as const;

/** Pick a small, non-repeating invitation set for one landing visit. */
export function pickLandingPrompts(count = 3, random = Math.random) {
  const pool = [...LANDING_PROMPTS];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
