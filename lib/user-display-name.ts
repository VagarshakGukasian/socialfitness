import type { User } from "@supabase/supabase-js";

/** Matches dashboard / profile copy: prefer full name, else email local part. */
export function getUserDisplayName(user: User): string {
  const email = user.email ?? "";
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email;
  return name.includes("@") ? (name.split("@")[0] ?? name) : name;
}
