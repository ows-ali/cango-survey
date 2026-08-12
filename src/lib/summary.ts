import type { Message, ResearchSummary } from "@/types";
import { chatWithFallback } from "@/lib/providers";
import { extractJson } from "@/lib/providers/json";

const EMPTY: ResearchSummary = {
  mainLearningProblems: [],
  realLifeSituations: [],
  currentLearningMethods: [],
  frustrations: [],
  desiredOutcomes: [],
  existingPaidSolutions: [],
  importantQuotes: [],
  otherInsights: [],
};

/**
 * Generates the structured research summary from the FULL transcript, not just
 * the last answer. Strict "do not invent" constraint.
 */
export async function generateSummary(
  targetLanguage: string,
  messages: Message[]
): Promise<{ summary: ResearchSummary; provider: string }> {
  const transcript = formatTranscript(messages);

  const systemPrompt = `You are a research analyst. You will be given the transcript of a conversational research interview about learning ${targetLanguage}.
Produce a structured research summary. You MUST only include information the participant actually provided. Never invent, infer as fact, or assume anything not stated.

The summary contains free-text fields for a short report:
- mainChallenge: the single biggest challenge in learning ${targetLanguage} (1 sentence)
- realSituation: a concrete real-life situation the participant mentioned (1 short sentence)
- currentSolution: what they currently use to learn (1 short sentence)
- mainFrustration: the biggest frustration (1 short sentence)
- desiredImprovement: what they want improved (1 short sentence)
- estimatedLevel: their approximate level of ${targetLanguage} IF they described it (beginner / elementary / intermediate / upper-intermediate / advanced / fluent). Use "" if not stated.
- payingInterest: whether they paid or would pay for a learning solution, based ONLY on what they said (e.g. "Has paid", "Would consider paying", "Not willing to pay"). Use "" if not stated.

And structured lists (empty arrays when nothing was mentioned):
- mainLearningProblems: string[]
- realLifeSituations: string[]
- currentLearningMethods: string[]
- frustrations: string[]
- desiredOutcomes: string[]
- existingPaidSolutions: string[]
- importantQuotes: verbatim participant quotes, keep them in the participant's own words: string[]
- otherInsights: additional notable insights: string[]

Respond ONLY with a valid JSON object matching this schema:
{
  "mainChallenge": "...",
  "realSituation": "...",
  "currentSolution": "...",
  "mainFrustration": "...",
  "desiredImprovement": "...",
  "estimatedLevel": "...",
  "payingInterest": "...",
  "mainLearningProblems": [],
  "realLifeSituations": [],
  "currentLearningMethods": [],
  "frustrations": [],
  "desiredOutcomes": [],
  "existingPaidSolutions": [],
  "importantQuotes": [],
  "otherInsights": []
}`;

  const userPrompt = `Interview transcript:

${transcript}

Generate the research summary JSON now.`;

  const { result, provider } = await chatWithFallback([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const raw = extractJson<Partial<ResearchSummary>>(result);
  return { summary: normalize(raw), provider };
}

function normalize(raw: Partial<ResearchSummary>): ResearchSummary {
  const asList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const asString = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

  return {
    ...EMPTY,
    mainChallenge: asString(raw.mainChallenge),
    realSituation: asString(raw.realSituation),
    currentSolution: asString(raw.currentSolution),
    mainFrustration: asString(raw.mainFrustration),
    desiredImprovement: asString(raw.desiredImprovement),
    estimatedLevel: asString(raw.estimatedLevel),
    payingInterest: asString(raw.payingInterest),
    mainLearningProblems: asList(raw.mainLearningProblems),
    realLifeSituations: asList(raw.realLifeSituations),
    currentLearningMethods: asList(raw.currentLearningMethods),
    frustrations: asList(raw.frustrations),
    desiredOutcomes: asList(raw.desiredOutcomes),
    existingPaidSolutions: asList(raw.existingPaidSolutions),
    importantQuotes: asList(raw.importantQuotes),
    otherInsights: asList(raw.otherInsights),
  };
}

function formatTranscript(messages: Message[]): string {
  return messages
    .map((m) => `${m.role === "interviewer" ? "Interviewer" : "Participant"}: ${m.text}`)
    .join("\n");
}
