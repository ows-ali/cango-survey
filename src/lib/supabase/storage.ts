import { getSupabase } from "./server";

const BUCKET_NAME = "interview-audio";

export async function uploadAudio(
  interviewId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  try {
    const supabase = getSupabase();

    const cleanMime = (mimeType || "audio/webm").split(";")[0].trim().toLowerCase();

    const ext = cleanMime.includes("wav")
      ? "wav"
      : cleanMime.includes("mp3")
      ? "mp3"
      : cleanMime.includes("ogg")
      ? "ogg"
      : cleanMime.includes("mp4") || cleanMime.includes("m4a")
      ? "mp4"
      : "webm";

    const fileName = `${interviewId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, { contentType: cleanMime, upsert: true });

    if (error) {
      console.error("[Storage] Audio upload to Supabase Storage failed:", error.message, error);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    console.log("[Storage] Uploaded audio public URL:", data?.publicUrl);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.warn("Failed to upload audio:", err);
    return null;
  }
}
