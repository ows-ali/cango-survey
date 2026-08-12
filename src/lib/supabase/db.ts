import { getSupabase, mapInterview, mapMessage } from "./server";
import type { Interview, Message, ResearchSummary, Role } from "@/types";
import type { LangCode } from "@/lib/languages";

export async function createInterview(language: LangCode): Promise<Interview> {
  const { data, error } = await getSupabase()
    .from("interviews")
    .insert({ status: "in_progress", language })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create interview: ${error?.message}`);
  return mapInterview(data as never);
}

export async function getInterview(id: string): Promise<Interview | null> {
  const { data, error } = await getSupabase()
    .from("interviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapInterview(data as never);
}

export async function addMessage(input: {
  interviewId: string;
  role: Role;
  text: string;
  questionCategory?: string | null;
  isFollowup?: boolean;
  provider?: string | null;
}): Promise<Message> {
  const { data, error } = await getSupabase()
    .from("interview_messages")
    .insert({
      interview_id: input.interviewId,
      role: input.role,
      text: input.text,
      question_category: input.questionCategory ?? null,
      is_followup: input.isFollowup ?? false,
      provider: input.provider ?? null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to save message: ${error?.message}`);
  return mapMessage(data as never);
}

export async function listMessages(interviewId: string): Promise<Message[]> {
  const { data, error } = await getSupabase()
    .from("interview_messages")
    .select("*")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load messages: ${error?.message}`);
  return (data ?? []).map((row) => mapMessage(row as never));
}

export async function completeInterview(
  id: string,
  summary: ResearchSummary,
  provider: string | null
): Promise<void> {
  const interview = await getInterview(id);
  if (!interview) throw new Error("Interview not found");

  const started = new Date(interview.startedAt).getTime();
  const durationSeconds = Math.max(1, Math.round((Date.now() - started) / 1000));

  const { error } = await getSupabase()
    .from("interviews")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      generated_summary: summary,
      provider,
    })
    .eq("id", id);

  if (error) throw new Error(`Failed to complete interview: ${error?.message}`);
}

/** For admin dashboard: all interviews with message count, newest first. */
export async function listInterviews(): Promise<Interview[]> {
  const { data, error } = await getSupabase()
    .from("interviews")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Failed to list interviews: ${error?.message}`);
  return (data ?? []).map((row) => mapInterview(row as never));
}

export async function getInterviewWithMessages(id: string) {
  const interview = await getInterview(id);
  if (!interview) return null;
  const messages = await listMessages(id);
  return { ...interview, messages };
}
