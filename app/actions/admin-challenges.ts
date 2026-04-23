"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

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
  const image_url = String(formData.get("image_url") ?? "").trim() || null;
  const duration_days = Math.max(
    1,
    parseInt(String(formData.get("duration_days") ?? "30"), 10) || 30
  );
  const interval_days = Math.max(
    1,
    parseInt(String(formData.get("interval_days") ?? "1"), 10) || 1
  );

  if (!title) throw new Error("Нужно название");

  const { data, error } = await admin
    .from("challenges")
    .insert({
      slug,
      title,
      description,
      image_url,
      duration_days,
      interval_days,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/challenges");
  revalidatePath("/admin/challenges");
  redirect(`/admin/challenges/${data.id}/edit`);
}

export async function adminUpdateChallenge(challengeId: string, formData: FormData) {
  await requireAdmin();
  const admin = createServiceRoleClient();

  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  slug = slug ? slugify(slug) : slugify(title);
  const description = String(formData.get("description") ?? "").trim() || null;
  const image_url = String(formData.get("image_url") ?? "").trim() || null;
  const duration_days = Math.max(
    1,
    parseInt(String(formData.get("duration_days") ?? "30"), 10) || 30
  );
  const interval_days = Math.max(
    1,
    parseInt(String(formData.get("interval_days") ?? "1"), 10) || 1
  );

  if (!title) throw new Error("Нужно название");

  const { error } = await admin
    .from("challenges")
    .update({
      slug,
      title,
      description,
      image_url,
      duration_days,
      interval_days,
    })
    .eq("id", challengeId);

  if (error) throw error;

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
