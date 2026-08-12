import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import type { Interview, Message } from "@/types";

/**
 * Server-side Supabase client. Uses the service role key, so this must NEVER
 * be imported from client components.
 */
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  const options: Record<string, unknown> = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  };

  if (typeof globalThis.WebSocket === "undefined") {
    options.realtime = { transport: ws };
  }

  return createClient(url, key, options);
}

export type InterviewRow = Omit<Interview, "startedAt" | "completedAt" | "generatedSummary"> & {
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  generated_summary: Interview["generatedSummary"];
};

export type MessageRow = Omit<
  Message,
  "createdAt" | "isFollowup" | "questionCategory" | "interviewId" | "audioRef"
> & {
  interview_id: string;
  created_at: string;
  is_followup: boolean;
  question_category: string | null;
  audio_ref: string | null;
};

export function mapInterview(row: InterviewRow): Interview {
  return {
    id: row.id,
    status: row.status,
    language: row.language,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    generatedSummary: row.generated_summary,
    provider: row.provider,
  };
}

export function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    interviewId: row.interview_id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at,
    questionCategory: row.question_category,
    isFollowup: row.is_followup,
    provider: row.provider,
    audioRef: row.audio_ref,
  };
}
