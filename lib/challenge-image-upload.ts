import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "challenge-images";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadChallengeCoverImage(
  admin: SupabaseClient,
  file: File
): Promise<string> {
  const mime = file.type;
  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new Error(
      "Допустимы только JPEG, PNG, WebP, GIF и SVG."
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Файл больше 5 МБ.");
  }

  const path = `covers/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });

  if (error) throw error;

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
