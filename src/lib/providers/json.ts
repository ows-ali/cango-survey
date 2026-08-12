/**
 * Robust extraction of a JSON object from a model response that may be
 * wrapped in markdown code fences or contain surrounding prose.
 */
export function extractJson<T>(text: string): T {
  const cleaned = text.trim();

  // Strip markdown code fences.
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : cleaned;

  // Find the outermost {...} block.
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON object found in model response: ${text.slice(0, 200)}`);
  }

  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
