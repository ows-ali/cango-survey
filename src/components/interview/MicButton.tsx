"use client";

export default function MicButton({
  phase,
  onClick,
  disabled,
}: {
  phase: "ready" | "recording" | "listening" | "thinking" | "speaking";
  onClick: () => void;
  disabled: boolean;
}) {
  const recording = phase === "recording";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={recording ? "Stop recording" : "Start recording"}
      className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
        recording
          ? "bg-red-500 text-white pulse-ring"
          : "bg-accent text-white hover:opacity-90"
      } ${disabled ? "opacity-40" : ""}`}
    >
      {recording ? (
        <span className="block h-6 w-6 rounded-sm bg-white" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      )}
    </button>
  );
}
