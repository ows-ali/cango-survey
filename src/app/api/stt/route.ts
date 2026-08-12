import { NextResponse } from "next/server";
import { transcribeWithFallback } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("audio");
    const language = typeof form.get("language") === "string" ? (form.get("language") as string) : "en";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "audio/webm";

    const { result: transcript, provider } = await transcribeWithFallback(buffer, mimeType);

    return NextResponse.json({ transcript, language, provider });
  } catch (err) {
    console.error("STT failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}