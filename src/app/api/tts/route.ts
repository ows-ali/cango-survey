import { NextResponse } from "next/server";
import { synthesizeWithFallback } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string" || text.length === 0) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const { result, provider } = await synthesizeWithFallback(text);
    const body = new Uint8Array(result.audio);

    return new Response(body, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(body.byteLength),
        "X-TTS-Provider": provider,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("TTS failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Speech synthesis failed" },
      { status: 500 }
    );
  }
}