import { NextResponse } from "next/server";
import { getInterview, listMessages, completeInterview } from "@/lib/supabase/db";
import { generateSummary } from "@/lib/summary";
import { getLang } from "@/lib/languages";

export async function POST(request: Request) {
  try {
    const { interviewId } = await request.json();

    if (!interviewId || typeof interviewId !== "string") {
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
    }

    const interview = await getInterview(interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const messages = await listMessages(interviewId);
    const { summary, provider } = await generateSummary(
      getLang(interview.language).targetLanguageName,
      messages
    );

    await completeInterview(interviewId, summary, provider);

    return NextResponse.json({ summary, provider });
  } catch (err) {
    console.error("Interview finish failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summary generation failed" },
      { status: 500 }
    );
  }
}