/**
 * Browser microphone + MediaRecorder helpers. Turn-based voice capture:
 * press to record, press again to stop and get an audio blob.
 */

let mediaStream: MediaStream | null = null;

export function isRecordingSupported(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined";
}

/** Requests mic permission. Throws a descriptive Error on failure. */
export async function requestMicrophone(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not supported in this browser.");
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream = stream;
    return stream;
  } catch (err) {
    if (err instanceof DOMException && err.name === "NotAllowedError") {
      throw new Error("Microphone access was denied. You can still type your answers.");
    }
    if (err instanceof DOMException && err.name === "NotFoundError") {
      throw new Error("No microphone was found. You can still type your answers.");
    }
    throw new Error("Could not access the microphone. You can still type your answers.");
  }
}

export function getMediaStream(): MediaStream | null {
  return mediaStream;
}

export function stopMicrophone() {
  mediaStream?.getTracks().forEach((t) => t.stop());
  mediaStream = null;
}

export interface RecorderResult {
  blob: Blob;
  mimeType: string;
}

/**
 * Records until `onStop` is called or the returned stop() is invoked.
 * Returns a promise resolving to the recorded audio blob.
 */
export function startRecording(stream: MediaStream): Promise<RecorderResult> {
  return new Promise((resolve, reject) => {
    const options: MediaRecorderOptions = {};
    const mimeType = pickMimeType();
    if (mimeType) options.mimeType = mimeType;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("MediaRecorder unavailable."));
        return;
      }
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      resolve({ blob, mimeType: blob.type });
    };
    recorder.onerror = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reject(new Error(`Recording failed: ${(e as any).error?.name ?? "unknown"}`));
    };

    recorder.start(250);
    activeRecorder = recorder;
  });
}

let activeRecorder: MediaRecorder | null = null;

export function stopRecording(): boolean {
  if (activeRecorder && activeRecorder.state !== "inactive") {
    activeRecorder.stop();
    activeRecorder = null;
    return true;
  }
  return false;
}

export function isRecording(): boolean {
  return activeRecorder !== null && activeRecorder.state === "recording";
}

function pickMimeType(): string | null {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/wav",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}

/** Tries the browser SpeechSynthesis API as a final TTS fallback. */
export async function speakWithBrowser(text: string): Promise<void> {
  if (!("speechSynthesis" in window)) {
    throw new Error("Browser speech synthesis unavailable.");
  }

  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith("en-GB")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0];

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  if (preferred) utter.voice = preferred;

  await new Promise<void>((resolve) => {
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}
