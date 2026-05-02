import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "team-avatars";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload as authenticated user; object path must start with `userId/`. */
export async function uploadTeamAvatarForUser(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const mime = file.type;
  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new Error("Only JPEG, PNG, WebP, and GIF are allowed for team avatar.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Team picture must be 5 MB or smaller.");
  }

  const path = `${userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
