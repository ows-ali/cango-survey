/**
 * Core configuration for the German/Italian learner research prototype.
 * All model IDs, provider keys and tuning knobs live here so they are
 * trivial to change without touching feature code.
 */

export const CONFIG = {
  /** Timeout for a single provider call, in milliseconds. */
  requestTimeoutMs: 45_000,

  /** Target interview duration, in minutes. */
  targetDurationMinutes: 10,

  /** Hard cap on interviewer questions (incl. follow-ups), ~12 min budget. */
  maxQuestions: 8,

  /** Max follow-up questions on a single topic before the interviewer must move on. */
  maxFollowUpsPerTopic: 3,

  /** Language of the interview by default (the research runs in English by design). */
  interviewLanguage: "en",
} as const;

/**
 * Provider config. `primary` is tried first; `fallback` is used when the
 * primary fails (timeout, quota, network, malformed response). Each provider
 * implements LLM chat, speech-to-text and text-to-speech.
 */
export const PROVIDERS = {
  primary: "gemini",
  fallback: "groq",
} as const;

export type ProviderName = "gemini" | "groq";

export const PROVIDER_ORDER: ProviderName[] = ["gemini", "groq"];

/** Model IDs for each provider. Centralised so they can be swapped easily. */
export const MODELS: Record<ProviderName, { llm: string; stt: string; tts: string }> = {
  gemini: {
    llm: "gemini-3.6-flash",
    stt: "gemini-3.6-flash", // native audio understanding for transcription
    tts: "gemini-3.1-flash-tts-preview",
  },
  groq: {
    llm: "llama-3.3-70b-versatile",
    stt: "whisper-large-v3-turbo",
    tts: "canopylabs/orpheus-v1-english",
  },
};

/** Voices for TTS per provider. */
export const VOICES: Record<ProviderName, string> = {
  gemini: "Zephyr", // calm, neutral
  groq: "hannah", // warm, neutral
};
