import { NextResponse } from "next/server";
import { createInterview } from "@/lib/supabase/db";
import { isLangCode } from "@/lib/languages";
import type { LangCode } from "@/lib/languages";

export async function POST(request: Request) {
  try {
    let body: { language?: string } = {};
    try {
      body = await request.json();
    } catch {
      // ignore invalid body, fall back to defaults
    }

    const langValue = body.language ?? null;
    const language: LangCode = isLangCode(langValue) ? langValue : "de";
    const interview = await createInterview(language);

    return NextResponse.json({ interview });
  } catch (err) {
    console.error("Failed to create interview:", err);
    return NextResponse.json({ error: "Failed to start interview" }, { status: 500 });
  }
}
