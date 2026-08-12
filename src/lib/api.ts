import type { Interview, InterviewerDecision, ResearchSummary } from "@/types";
import type { LangConfig } from "@/lib/languages";

/** Client-side wrappers around the API routes. */

export async function createInterview(lang: LangConfig["code"]): Promise<Interview> {
  const res = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: lang }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to start interview.");
  return data.interview as Interview;
}

export async function askInterviewer(
  interviewId: string,
  participantText?: string
): Promise<{
  decision: InterviewerDecision;
  provider: string;
  questionCount: number;
}> {
  const res = await fetch("/api/interview/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId, participantText }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "The interviewer had a problem.");
  return data;
}

export async function finishInterview(
  interviewId: string
): Promise<{ summary: ResearchSummary; provider: string }> {
  const res = await fetch("/api/interview/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to generate the summary.");
  return data;
}

export async function transcribeAudio(blob: Blob): Promise<{ transcript: string }> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  const res = await fetch("/api/stt", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Speech recognition failed.");
  return data;
}

/** TTS to speech and play in the browser. Returns whether it worked. */
export async function speakText(text: string): Promise<boolean> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch((err) => {
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
    return true;
  } catch {
    return false;
  }
}
