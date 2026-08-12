import { NextResponse } from "next/server";
import { getInterview, listMessages, addMessage } from "@/lib/supabase/db";
import { askInterviewer } from "@/lib/interviewer";
import { getLang } from "@/lib/languages";

export async function POST(request: Request) {
  try {
    const { interviewId, participantText } = await request.json();

    if (!interviewId || typeof interviewId !== "string") {
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
    }
    if (participantText !== undefined && (typeof participantText !== "string" || participantText.trim() === "")) {
      return NextResponse.json({ error: "Participant answer must be non-empty text" }, { status: 400 });
    }

    const interview = await getInterview(interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Save the participant's answer if this is a follow-up turn (not the first question).
    if (participantText) {
      await addMessage({
        interviewId,
        role: "participant",
        text: participantText.trim(),
      });
    }

    const messages = await listMessages(interviewId);
    const questionCount = messages.filter((m) => m.role === "interviewer").length;
    const lastInterviewerMessage = [...messages].reverse().find((m) => m.role === "interviewer");

    const { decision, provider } = await askInterviewer(
      getLang(interview.language).targetLanguageName,
      messages,
      questionCount,
      lastInterviewerMessage?.questionCategory ?? null
    );

    // Save the interviewer's question.
    const interviewerMessage = await addMessage({
      interviewId,
      role: "interviewer",
      text: decision.question,
      questionCategory: decision.category ?? null,
      isFollowup: decision.isFollowup,
      provider,
    });

    return NextResponse.json({
      decision,
      interviewerMessage,
      provider,
      questionCount: questionCount + 1,
    });
  } catch (err) {
    console.error("Interviewer ask failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interviewer failed" },
      { status: 500 }
    );
  }
}