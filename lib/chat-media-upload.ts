import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "chat-media";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const MAX_BYTES = 25 * 1024 * 1024;

export async function uploadChatMediaForUser(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ publicUrl: string; mimeType: string }> {
  const mime = file.type;
  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new Error(
      "Unsupported media type. Use JPEG, PNG, WebP, GIF, HEIC, MP4, MOV, or WebM."
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Each attachment must be 25 MB or smaller.");
  }

  const path = `${userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, mimeType: mime };
}
