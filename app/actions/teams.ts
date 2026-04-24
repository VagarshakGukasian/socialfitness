"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTeam(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("teams")
    .insert({ name: name.trim(), created_by: user.id })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/teams");
  revalidatePath("/profile");
  return data.id as string;
}

export async function addTeamMember(teamId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: userId });

  if (error) throw error;
  revalidatePath(`/teams/${teamId}`);
  revalidatePath(`/teams/${teamId}/members`);
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
