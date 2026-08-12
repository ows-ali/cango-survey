import type { ProviderName } from "@/lib/constants";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AudioFormat = "wav" | "mp3" | "webm";

/** Minimal interface each provider must implement. */
export interface LlmProvider {
  readonly name: ProviderName;

  /**
   * Single-turn chat completion (system + messages) returning raw text.
   * Throws on failure so the fallback wrapper can retry with another provider.
   */
  chat(messages: ChatMessage[]): Promise<string>;

  /** Transcribe an audio buffer to text. */
  transcribe(audio: Buffer, mimeType: string): Promise<string>;

  /** Synthesize speech from text, returning the audio buffer. */
  synthesize(text: string): Promise<{ audio: Buffer; mimeType: string }>;
}