"use client";

const LABELS: Record<string, { label: string; detail: string; dot: string }> = {
  ready: { label: "Your turn", detail: "Tap the mic and speak", dot: "bg-accent" },
  listening: { label: "Listening", detail: "Transcribing your answer…", dot: "bg-amber-500" },
  recording: { label: "Recording", detail: "Speak now — tap to stop", dot: "bg-red-500" },
  thinking: { label: "Thinking", detail: "The interviewer is considering…", dot: "bg-accent" },
  speaking: { label: "Speaking", detail: "The interviewer is talking…", dot: "bg-accent" },
};

export default function StatusIndicator({ phase }: { phase: string }) {
  const info = LABELS[phase] ?? LABELS.ready;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${info.dot} ${phase === "recording" ? "animate-pulse" : ""}`}
        />
        <span className="text-sm font-medium text-foreground">{info.label}</span>
      </span>
      <span className="text-xs text-muted">{info.detail}</span>
    </div>
  );
}
