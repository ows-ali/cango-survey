import { CONFIG } from "@/lib/constants";
import type { Message } from "@/types";
import type { InterviewerDecision } from "@/types";
import { chatWithFallback } from "@/lib/providers";
import { extractJson } from "@/lib/providers/json";

/**
 * The interviewer is driven by a single stateful prompt rather than hardcoded
 * branching. It receives the full transcript and decides the next question.
 */
export async function askInterviewer(
  targetLanguage: string,
  messages: Message[],
  questionCount: number,
  currentCategory: string | null
): Promise<{ decision: InterviewerDecision; provider: string }> {
  const transcript = formatTranscript(messages);

  const systemPrompt = buildSystemPrompt(targetLanguage, questionCount);

  const currentTopic = currentCategory
    ? `\nThe current topic being explored is: ${currentCategory}. Stay on it only if there is more to learn; otherwise move to the next research area.`
    : "";

  const userPrompt = `Here is the transcript so far. Each line is prefixed with "Interviewer:" or "Participant:".

${transcript}${currentTopic}

Decide your next move now. Respond ONLY with a JSON object using this exact schema:
{
  "question": "the next question you will ask",
  "category": "one of the research areas, or the current category if following up",
  "is_followup": true,
  "end_interview": false
}

Constraints:
- Ask exactly one question, nothing else.
- If this is the very first turn, ask the introductory question about the participant's background and experience learning ${targetLanguage}.
- Ask one question at a time and do not answer for the participant.
- Do not ask about any specific app, product, company or AI feature. Do not mention any brand.
- Do not criticize the participant's language skills. Stay neutral and curious.
- Keep questions short, natural and conversational, as a human interviewer would.`;

  const { result, provider } = await chatWithFallback([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const decision = normalizeDecision(parseDecision(result), questionCount);
  return { decision, provider };
}

function buildSystemPrompt(targetLanguage: string, questionCount: number): string {
  const remaining = Math.max(0, CONFIG.maxQuestions - questionCount);

  return `You are a neutral, curious research interviewer conducting a 5-10 minute conversational interview.
You are researching the real problems people face when learning ${targetLanguage}.
The interview runs in the participant's own spoken language, so you may express yourself in whatever language they use.
Your job is unbiased problem discovery, NOT to promote any solution.

Research areas to cover, in any sensible order:
1. Current learning methods
2. What they find difficult about ${targetLanguage}
3. Real-life situations where ${targetLanguage} causes problems
4. What they dislike about current learning methods
5. How they prepare for difficult situations
6. Whether they have paid for ${targetLanguage} learning, and what made it worthwhile
7. What they wish existed
8. What outcome they would like from a better learning solution

Interviewing rules:
- Ask ONE question at a time and wait for the answer.
- Start by asking the participant to tell you a little about themselves and their experience learning ${targetLanguage}.
- Follow up dynamically on their answer when useful. If they give a short answer, ask a useful follow-up. If they give a detailed answer, move on rather than re-asking.
- Max ${CONFIG.maxFollowUpsPerTopic} follow-ups on one topic, then move to the next research area.
- After covering enough areas, end the interview with ${remaining} question(s) remaining in the budget (${CONFIG.maxQuestions} total questions).
- To end, set "end_interview": true and give a short, warm closing message in "question".
- Never criticize the participant's German/Italian or English.
- Never ask leading questions about AI features or specific products.
- Never mention any company, app, or brand.`;
}

function parseDecision(raw: string): InterviewerDecision {
  const parsed = extractJson<Record<string, unknown>>(raw);

  const question = typeof parsed.question === "string" ? parsed.question : undefined;
  if (!question) {
    throw new Error("Interviewer response missing 'question' field.");
  }

  return {
    question: question.trim(),
    category: typeof parsed.category === "string" ? parsed.category : undefined,
    isFollowup: Boolean(parsed.isFollowup ?? parsed.is_followup),
    endInterview: Boolean(parsed.endInterview ?? parsed.end_interview),
  };
}

/** Defensive normalisation: never ask more questions than the budget allows. */
function normalizeDecision(decision: InterviewerDecision, questionCount: number): InterviewerDecision {
  if (questionCount + 1 >= CONFIG.maxQuestions) {
    return {
      ...decision,
      endInterview: true,
      isFollowup: false,
    };
  }
  return decision;
}

function formatTranscript(messages: Message[]): string {
  return messages
    .map((m) => `${m.role === "interviewer" ? "Interviewer" : "Participant"}: ${m.text}`)
    .join("\n");
}
