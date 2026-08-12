import { GoogleGenAI } from "@google/genai";
import { MODELS, VOICES } from "@/lib/constants";
import type { ChatMessage, LlmProvider } from "./types";

/**
 * Gemini provider using the @google/genai SDK.
 * LLM + native audio understanding (STT) + native TTS in one key.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = "gemini" as const;
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "model", parts: [{ text: m.content }] }));

    const systemInstruction = messages.find((m) => m.role === "system")?.content;

    const response = await this.client.models.generateContent({
      model: MODELS.gemini.llm,
      contents,
      config: {
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        temperature: 0.5,
      },
    });

    const text = response.candidates?.[0]?.content?.parts
      ?.filter((p) => "text" in p && p.text)
      .map((p) => p.text)
      .join("\n");

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return text;
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: MODELS.gemini.stt,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: audio.toString("base64"),
              },
            },
            { text: "Transcribe the speech in this audio exactly as spoken. Return only the transcript, no commentary." },
          ],
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts
      ?.filter((p) => "text" in p && p.text)
      .map((p) => p.text)
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Gemini transcription returned empty text.");
    }
    return text;
  }

  async synthesize(text: string): Promise<{ audio: Buffer; mimeType: string }> {
    const response = await this.client.models.generateContent({
      model: MODELS.gemini.tts,
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES.gemini } },
        },
        responseModalities: ["AUDIO"],
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (p) => "inlineData" in p && p.inlineData
    );

    const data = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType ?? "audio/mp3";

    if (!data) {
      throw new Error("Gemini TTS returned no audio data.");
    }
    return { audio: Buffer.from(data, "base64"), mimeType };
  }
}