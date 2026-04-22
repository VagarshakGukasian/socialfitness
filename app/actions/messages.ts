"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function postTeamMessage(
  challengeId: string,
  teamId: string,
  body: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const text = body.trim();
  if (!text) return;

  const { error } = await supabase.from("challenge_messages").insert({
    challenge_id: challengeId,
    team_id: teamId,
    author_id: user.id,
    is_official: false,
    body: text,
  });

  if (error) throw error;
  revalidatePath(`/challenges/${challengeId}/teams/${teamId}/chat`);
}
