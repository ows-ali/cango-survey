import { NextResponse } from "next/server";
import { transcribeWithFallback } from "@/lib/providers";
import { uploadAudio } from "@/lib/supabase/storage";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("audio");
    const language = typeof form.get("language") === "string" ? (form.get("language") as string) : "en";
    const interviewId = typeof form.get("interviewId") === "string" ? (form.get("interviewId") as string) : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "audio/webm";

    const [{ result: transcript, provider }, audioUrl] = await Promise.all([
      transcribeWithFallback(buffer, mimeType),
      interviewId ? uploadAudio(interviewId, buffer, mimeType) : Promise.resolve(null),
    ]);

    return NextResponse.json({ transcript, language, provider, audioUrl });
  } catch (err) {
    console.error("STT failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}