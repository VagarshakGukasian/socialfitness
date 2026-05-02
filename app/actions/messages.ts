"use server";

import { revalidatePath } from "next/cache";
import { uploadChatMediaForUser } from "@/lib/chat-media-upload";
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

/** Text and/or up to 3 photo/video attachments. */
export async function postTeamChatForm(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const challengeId = String(formData.get("challenge_id") ?? "").trim();
  const teamId = String(formData.get("team_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawFiles = formData
    .getAll("attachments")
    .filter((x): x is File => x instanceof File && x.size > 0)
    .slice(0, 3);

  if (!challengeId || !teamId) throw new Error("Missing chat context");
  if (!body && rawFiles.length === 0) return;

  const { data: msg, error: insErr } = await supabase
    .from("challenge_messages")
    .insert({
      challenge_id: challengeId,
      team_id: teamId,
      author_id: user.id,
      is_official: false,
      body: body || " ",
    })
    .select("id")
    .single();

  if (insErr) throw insErr;
  const messageId = msg.id as string;

  let order = 0;
  for (const file of rawFiles) {
    const { publicUrl, mimeType } = await uploadChatMediaForUser(
      supabase,
      user.id,
      file
    );
    const { error: attErr } = await supabase
      .from("challenge_message_attachments")
      .insert({
        message_id: messageId,
        media_url: publicUrl,
        sort_order: order,
        mime_type: mimeType,
      });
    if (attErr) throw attErr;
    order += 1;
  }

  revalidatePath(`/challenges/${challengeId}/teams/${teamId}/chat`);
}
