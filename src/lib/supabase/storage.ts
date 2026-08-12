import { getSupabase } from "./server";

const BUCKET_NAME = "interview-audio";

export async function uploadAudio(
  interviewId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  try {
    const supabase = getSupabase();

    const ext = mimeType.includes("wav")
      ? "wav"
      : mimeType.includes("mp3")
      ? "mp3"
      : mimeType.includes("ogg")
      ? "ogg"
      : "webm";

    const fileName = `${interviewId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, { contentType: mimeType, upsert: true });

    if (error) {
      console.warn("Audio upload to Supabase Storage failed:", error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.warn("Failed to upload audio:", err);
    return null;
  }
}
