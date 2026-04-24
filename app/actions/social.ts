"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function followUser(followingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (followingId === user.id) return;

  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: user.id, following_id: followingId });
  if (error) throw error;
  revalidatePath("/users");
  revalidatePath("/feed");
  revalidatePath("/profile");
}

export async function unfollowUser(followingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);
  if (error) throw error;
  revalidatePath("/users");
  revalidatePath("/feed");
  revalidatePath("/profile");
}
