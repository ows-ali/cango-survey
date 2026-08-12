import Groq from "groq-sdk";
import { MODELS, VOICES } from "@/lib/constants";
import type { ChatMessage, LlmProvider } from "./types";

/**
 * Groq provider (OpenAI-compatible). Free tier fallback for Gemini.
 * Chat = Llama 3.3 70B, STT = Whisper turbo, TTS = Orpheus.
 */
export class GroqProvider implements LlmProvider {
  readonly name = "groq" as const;
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: MODELS.groq.llm,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.5,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Groq returned an empty chat response.");
    }
    return text;
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    const cleanMime = (mimeType || "audio/webm").split(";")[0].trim().toLowerCase();
    const rawExt = cleanMime.split("/")[1] ?? "webm";
    const allowed = ["flac", "mp3", "mp4", "mpeg", "mpga", "m4a", "ogg", "opus", "wav", "webm"];
    const ext = allowed.includes(rawExt) ? rawExt : "webm";

    const file = new File([new Uint8Array(audio)], `audio.${ext}`, { type: cleanMime });

    const transcription = await this.client.audio.transcriptions.create({
      model: MODELS.groq.stt,
      file,
    });

    const text = transcription.text?.trim();
    if (!text) {
      throw new Error("Groq transcription returned empty text.");
    }
    return text;
  }

  async synthesize(text: string): Promise<{ audio: Buffer; mimeType: string }> {
    try {
      const response = await this.client.audio.speech.create({
        model: MODELS.groq.tts,
        input: text,
        voice: VOICES.groq,
        response_format: "wav",
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return { audio: buffer, mimeType: "audio/wav" };
    } catch (err) {
      throw new Error(`Groq TTS failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}