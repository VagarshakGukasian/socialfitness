"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadTeamAvatarForUser } from "@/lib/team-avatar-upload";
import {
  isDefaultTeamAvatarUrl,
  randomTeamAvatarUrl,
} from "@/lib/team-default-avatars";
import { createClient } from "@/lib/supabase/server";

export async function createTeamFromForm(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const defaultUrl = String(formData.get("team_avatar_default") ?? "").trim();
  const avatarFile = formData.get("team_avatar");

  let avatar_url = randomTeamAvatarUrl();
  if (defaultUrl && isDefaultTeamAvatarUrl(defaultUrl)) {
    avatar_url = defaultUrl;
  }
  if (avatarFile instanceof File && avatarFile.size > 0) {
    avatar_url = await uploadTeamAvatarForUser(supabase, user.id, avatarFile);
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      created_by: user.id,
      is_solo: false,
      avatar_url,
    })
    .select("id")
    .single();

  if (error) throw error;
  const id = data.id as string;
  revalidatePath("/teams");
  revalidatePath("/profile");
  redirect(`/teams/${id}`);
}

export async function updateTeamFromForm(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const teamId = String(formData.get("team_id") ?? "").trim();
  if (!teamId) throw new Error("Missing team");

  const { data: team } = await supabase
    .from("teams")
    .select("id, created_by, is_solo")
    .eq("id", teamId)
    .maybeSingle();

  if (!team || team.created_by !== user.id || team.is_solo) {
    throw new Error("Not allowed");
  }

  const name = String(formData.get("name") ?? "").trim();
  const defaultUrl = String(formData.get("team_avatar_default") ?? "").trim();
  const avatarFile = formData.get("team_avatar");

  const patch: { name?: string; avatar_url?: string } = {};
  if (name) patch.name = name;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    patch.avatar_url = await uploadTeamAvatarForUser(supabase, user.id, avatarFile);
  } else if (defaultUrl && isDefaultTeamAvatarUrl(defaultUrl)) {
    patch.avatar_url = defaultUrl;
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("teams").update(patch).eq("id", teamId);
  if (error) throw error;

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/profile");
}

export async function addTeamMember(teamId: string, userId: string) {
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("teams")
    .select("is_solo")
    .eq("id", teamId)
    .single();
  if (t?.is_solo) {
    throw new Error("Solo team cannot add members");
  }
  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: userId });

  if (error) throw error;
  revalidatePath(`/teams/${teamId}`);
  revalidatePath(`/teams/${teamId}/members`);
  revalidatePath("/profile");
}

export async function removeTeamMember(teamId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: t } = await supabase
    .from("teams")
    .select("is_solo, created_by")
    .eq("id", teamId)
    .single();
  if (t?.is_solo) {
    throw new Error("Cannot remove members from a solo team");
  }
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);
  if (error) throw error;
  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/profile");
}

export async function enrollTeamInChallenge(teamId: string, challengeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("team_challenge_enrollments").insert({
    team_id: teamId,
    challenge_id: challengeId,
  });

  if (error) throw error;
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath("/profile");
}

export async function quitTeamChallenge(teamId: string, challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("quit_team_challenge", {
    p_team_id: teamId,
    p_challenge_id: challengeId,
  });

  if (error) throw error;

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath(`/challenges/${challengeId}/teams/${teamId}/chat`);
  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/profile");
}
