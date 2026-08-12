"use client";

import { useState } from "react";
import type { LangConfig } from "@/lib/languages";

export default function ConsentModal({
  config,
  onBegin,
  disabled,
  speechUnavailable,
}: {
  config: LangConfig;
  onBegin: () => void;
  disabled: boolean;
  speechUnavailable: boolean;
}) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Before we begin
      </h1>

      <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
        You&apos;ll have a short, spoken conversation with an AI interviewer about your experience
        learning {config.targetLanguageName}. This is research — there are no right or wrong
        answers.
      </p>

      <div className="mt-6 max-w-lg rounded-2xl border border-border bg-surface p-6 text-left">
        <p className="text-sm leading-relaxed text-foreground">
          <strong className="font-medium">About your privacy:</strong> your voice will be recorded
          and transcribed so the interviewer can respond. Your responses are stored anonymously and
          used only for language-learning research. No personal information is collected, and no
          account is required.
        </p>

        <label className="mt-5 flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
          />
          <span>
            I agree that my responses may be recorded/transcribed and used for language-learning
            research.
          </span>
        </label>
      </div>

      {speechUnavailable && (
        <p className="mt-4 text-sm text-amber-600">
          Your browser doesn&apos;t support voice recording. You can still take part by typing your
          answers.
        </p>
      )}

      <button
        onClick={onBegin}
        disabled={!agreed || disabled}
        className="mt-8 rounded-full bg-foreground px-8 py-4 text-base font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        Begin interview
      </button>
    </div>
  );
}
