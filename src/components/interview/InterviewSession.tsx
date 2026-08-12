"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LangConfig } from "@/lib/languages";
import type { ResearchSummary } from "@/types";
import {
  createInterview,
  askInterviewer,
  finishInterview,
  transcribeAudio,
  speakText,
} from "@/lib/api";
import {
  requestMicrophone,
  startRecording,
  stopRecording,
  isRecordingSupported,
  stopMicrophone,
  speakWithBrowser,
} from "@/lib/speech";
import MicButton from "./MicButton";
import StatusIndicator from "./StatusIndicator";
import ConsentModal from "./ConsentModal";
import SummaryView from "./SummaryView";

type Phase =
  | "consent"
  | "ready"
  | "listening"
  | "recording"
  | "thinking"
  | "speaking"
  | "finished";

export default function InterviewSession({ config }: { config: LangConfig }) {
  const [phase, setPhase] = useState<Phase>("consent");
  const [micReady, setMicReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [provider, setProvider] = useState<string | null>(null);
  const [summary, setSummary] = useState<ResearchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const interviewIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const targetLanguage = config.targetLanguageName;

  /** Advance the interview: save answer (if any), get next question, speak it. */
  const advance = useCallback(
    async (answer?: string, audioUrl?: string | null) => {
      if (busyRef.current) return;
      busyRef.current = true;

      try {
        setPhase("thinking");
        setTranscript("");
        setError(null);

        const id = interviewIdRef.current!;
        const { decision, provider: p } = await askInterviewer(id, answer, audioUrl);

        setProvider(p);
        setCurrentQuestion(decision.question);

        if (decision.endInterview) {
          setPhase("thinking");
          const { summary: s } = await finishInterview(id);
          setSummary(s);
          setPhase("finished");
          stopMicrophone();
          return;
        }

        setPhase("speaking");
        const spoken = await speakText(decision.question);
        if (!spoken) {
          await speakWithBrowser(decision.question);
        }
        setPhase("ready");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        setPhase("ready");
      } finally {
        busyRef.current = false;
      }
    },
    []
  );

  /** Handle mic click: start or stop recording. */
  const handleMicClick = useCallback(async () => {
    if (phase === "recording") {
      const stopped = stopRecording();
      if (stopped) setPhase("listening");
      return;
    }

    if (phase !== "ready") return;

    if (!micReady) {
      setMicError(null);
      try {
        await requestMicrophone();
        setMicReady(true);
      } catch (err) {
        setMicError(err instanceof Error ? err.message : "Microphone unavailable.");
        setPhase("ready");
        return;
      }
    }

    try {
      setPhase("recording");
      setTranscript("");
      const { blob } = await startRecording(await requestMicrophone());
      setPhase("thinking");

      const { transcript: text, audioUrl } = await transcribeAudio(blob, interviewIdRef.current);
      if (!text.trim()) {
        setError("I couldn't hear anything. Please try again or type your answer.");
        setPhase("ready");
        return;
      }

      await advance(text.trim(), audioUrl);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Recording failed. Please try again.");
      setPhase("ready");
    }
  }, [phase, micReady, advance]);

  /** Text fallback — always available. */
  const handleSubmitText = useCallback(
    async (text: string) => {
      if (!text.trim() || busyRef.current) return;
      await advance(text.trim());
    },
    [advance]
  );

  /** Begin the interview: create record, fetch first question. */
  const handleBegin = useCallback(async () => {
    setPhase("thinking");
    setError(null);
    try {
      const interview = await createInterview(config.code);
      interviewIdRef.current = interview.id;
      await advance();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to start the interview.");
      setPhase("consent");
    }
  }, [config.code, advance]);

  /** Participant ends the interview early; still generate the summary. */
  const handleEndInterview = useCallback(async () => {
    if (busyRef.current || !interviewIdRef.current) return;
    busyRef.current = true;
    setPhase("thinking");
    setError(null);
    try {
      const { summary: s } = await finishInterview(interviewIdRef.current);
      setSummary(s);
      setPhase("finished");
      stopMicrophone();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to end the interview.");
      setPhase("ready");
    } finally {
      busyRef.current = false;
    }
  }, []);

  // Warm up the mic stream during consent so the first recording is instant.
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  const speechUnavailable = !isRecordingSupported();
  const busy = phase === "thinking" || phase === "speaking";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            {config.microLabel}
          </h2>
          {provider && phase !== "finished" && (
            <span className="text-xs text-muted">model: {provider}</span>
          )}
        </div>

        {phase === "consent" && (
          <ConsentModal
            config={config}
            onBegin={handleBegin}
            disabled={busy}
            speechUnavailable={speechUnavailable}
          />
        )}

        {phase === "finished" && summary && (
          <SummaryView summary={summary} targetLanguage={targetLanguage} />
        )}

        {phase !== "consent" && phase !== "finished" && (
          <div className="flex flex-col items-center text-center">
            <StatusIndicator phase={phase} />

            <p className="mt-10 min-h-[4.5rem] max-w-xl text-xl leading-relaxed text-foreground sm:text-2xl">
              {currentQuestion || "Loading…"}
            </p>

            <div className="mt-10 flex flex-col items-center gap-3">
              <MicButton phase={phase} onClick={handleMicClick} disabled={phase === "thinking"} />

              {micError && <p className="text-sm text-red-600">{micError}</p>}

              <p className="text-sm text-muted">
                {phase === "ready" && "Tap the microphone to answer, or type below."}
                {phase === "listening" && "Transcribing…"}
                {phase === "recording" && "Recording… tap to stop"}
                {phase === "thinking" && "Thinking…"}
                {phase === "speaking" && "Speaking…"}
              </p>
            </div>

            {transcript && (
              <p className="mt-6 max-w-xl text-base italic text-muted">“{transcript}”</p>
            )}

            {error && (
              <p className="mt-6 max-w-xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-10 w-full max-w-xl">
              <TextFallback onSubmit={handleSubmitText} disabled={busy} />
            </div>

            <button
              onClick={handleEndInterview}
              disabled={busy}
              className="mt-8 text-sm text-muted underline-offset-4 hover:underline disabled:opacity-50"
            >
              End interview
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function TextFallback({
  onSubmit,
  disabled,
}: {
  onSubmit: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim() || disabled) return;
        onSubmit(value);
        setValue("");
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Or type your answer…"
        className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full bg-accent px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
