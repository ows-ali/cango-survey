import { PROVIDER_ORDER, CONFIG } from "@/lib/constants";
import type { ProviderName } from "@/lib/constants";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import type { ChatMessage, LlmProvider } from "./types";

export { GeminiProvider, GroqProvider };
export type { ChatMessage, LlmProvider };

/** Lazily-built provider instances keyed by name. */
const cache = new Map<ProviderName, LlmProvider>();

/** Provider classes by name, resolved from env keys on first use. */
const providerFactories: Record<ProviderName, () => LlmProvider> = {
  gemini: () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY.");
    return new GeminiProvider(key);
  },
  groq: () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("Missing GROQ_API_KEY.");
    return new GroqProvider(key);
  },
};

function getProvider(name: ProviderName): LlmProvider {
  if (!cache.has(name)) {
    cache.set(name, providerFactories[name]());
  }
  return cache.get(name)!;
}

/** All configured providers, primary first. Skips missing keys. */
export function getAvailableProviders(): LlmProvider[] {
  const providers: LlmProvider[] = [];
  for (const name of PROVIDER_ORDER) {
    if (name === "gemini" && !process.env.GEMINI_API_KEY) continue;
    if (name === "groq" && !process.env.GROQ_API_KEY) continue;
    providers.push(getProvider(name));
  }
  return providers;
}

/**
 * Runs `fn` against the primary provider and falls back to each configured
 * fallback provider in order when the primary fails or times out.
 * Returns the result plus the provider that served it.
 */
export async function withFallback<T>(
  fn: (provider: LlmProvider) => Promise<T>
): Promise<{ result: T; provider: ProviderName }> {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    throw new Error("No AI providers configured. Set GEMINI_API_KEY or GROQ_API_KEY.");
  }

  let lastError: unknown = null;
  for (const provider of providers) {
    try {
      const result = await withTimeout(fn(provider), CONFIG.requestTimeoutMs);
      return { result, provider: provider.name };
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${messageOf(lastError)}`);
}

/** LLM chat with automatic fallback. */
export async function chatWithFallback(messages: ChatMessage[]) {
  return withFallback((p) => p.chat(messages));
}

/** STT with automatic fallback. */
export async function transcribeWithFallback(audio: Buffer, mimeType: string) {
  return withFallback((p) => p.transcribe(audio, mimeType));
}

/** TTS with automatic fallback. */
export async function synthesizeWithFallback(text: string) {
  return withFallback((p) => p.synthesize(text));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
