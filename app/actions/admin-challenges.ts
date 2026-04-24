"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { uploadChallengeCoverImage } from "@/lib/challenge-image-upload";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function saveMessageTemplates(
  admin: SupabaseClient,
  challengeId: string,
  raw: string
) {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  await admin
    .from("challenge_message_templates")
    .delete()
    .eq("challenge_id", challengeId);
  if (lines.length === 0) return;
  const { error } = await admin.from("challenge_message_templates").insert(
    lines.map((body, position) => ({
      challenge_id: challengeId,
      position,
      body,
    }))
  );
  if (error) throw error;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    redirect("/challenges");
  }
  return user;
}

function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || `ch-${Date.now().toString(36)}`;
}

export async function adminCreateChallenge(formData: FormData) {
  await requireAdmin();
  const admin = createServiceRoleClient();

  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  slug = slug ? slugify(slug) : slugify(title);

  const description = String(formData.get("description") ?? "").trim() || null;

  let image_url: string | null = null;
  const createImage = formData.get("image");
  if (createImage instanceof File && createImage.size > 0) {
    image_url = await uploadChallengeCoverImage(admin, createImage);
  }

  const duration_days = Math.max(
    1,
    parseInt(String(formData.get("duration_days") ?? "30"), 10) || 30
  );
  const interval_days = Math.max(
    1,
    parseInt(String(formData.get("interval_days") ?? "1"), 10) || 1
  );

  if (!title) throw new Error("Title is required");

  const scheduleMode = String(
    formData.get("schedule_mode") ?? "evergreen"
  ).includes("date")
    ? "date_range"
    : "evergreen";
  const wStart = String(formData.get("window_start") ?? "").trim();
  const wEnd = String(formData.get("window_end") ?? "").trim();
  const templatesRaw = String(formData.get("message_templates") ?? "");

  const { data, error } = await admin
    .from("challenges")
    .insert({
      slug,
      title,
      description,
      image_url,
      duration_days,
      interval_days,
      schedule_mode: scheduleMode,
      window_start:
        scheduleMode === "date_range" && wStart
          ? wStart
          : null,
      window_end:
        scheduleMode === "date_range" && wEnd ? wEnd : null,
    })
    .select("id")
    .single();

  if (error) throw error;
  const id = data.id as string;
  await saveMessageTemplates(admin, id, templatesRaw);

  revalidatePath("/challenges");
  revalidatePath("/admin/challenges");
  redirect(`/admin/challenges/${id}/edit`);
}

export async function adminUpdateChallenge(challengeId: string, formData: FormData) {
  await requireAdmin();
  const admin = createServiceRoleClient();

  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  slug = slug ? slugify(slug) : slugify(title);
  const description = String(formData.get("description") ?? "").trim() || null;

  const imageFile = formData.get("image");
  let image_url =
    String(formData.get("current_image_url") ?? "").trim() || null;
  if (imageFile instanceof File && imageFile.size > 0) {
    image_url = await uploadChallengeCoverImage(admin, imageFile);
  }

  const duration_days = Math.max(
    1,
    parseInt(String(formData.get("duration_days") ?? "30"), 10) || 30
  );
  const interval_days = Math.max(
    1,
    parseInt(String(formData.get("interval_days") ?? "1"), 10) || 1
  );

  if (!title) throw new Error("Title is required");

  const scheduleMode = String(
    formData.get("schedule_mode") ?? "evergreen"
  ).includes("date")
    ? "date_range"
    : "evergreen";
  const wStart = String(formData.get("window_start") ?? "").trim();
  const wEnd = String(formData.get("window_end") ?? "").trim();
  const templatesRaw = String(formData.get("message_templates") ?? "");

  const { error } = await admin
    .from("challenges")
    .update({
      slug,
      title,
      description,
      image_url,
      duration_days,
      interval_days,
      schedule_mode: scheduleMode,
      window_start:
        scheduleMode === "date_range" && wStart
          ? wStart
          : null,
      window_end:
        scheduleMode === "date_range" && wEnd ? wEnd : null,
    })
    .eq("id", challengeId);

  if (error) throw error;
  await saveMessageTemplates(admin, challengeId, templatesRaw);

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath("/admin/challenges");
  revalidatePath(`/admin/challenges/${challengeId}/edit`);
}

export async function adminDeleteChallenge(challengeId: string) {
  await requireAdmin();
  const admin = createServiceRoleClient();

  const { error } = await admin.from("challenges").delete().eq("id", challengeId);

  if (error) throw error;

  revalidatePath("/challenges");
  revalidatePath("/admin/challenges");
  redirect("/admin/challenges");
}
