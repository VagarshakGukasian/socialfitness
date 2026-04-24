import { Users as UsersIcon } from "lucide-react";
import { FollowToggle } from "@/components/follow-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: urows } = await supabase
    .from("users")
    .select("id, display_name, email")
    .neq("id", user.id)
    .order("display_name", { ascending: true });

  const { data: frows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const following = new Set((frows ?? []).map((f) => f.following_id as string));

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-4 sm:py-8">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <UsersIcon className="h-6 w-6 text-[var(--accent)]" aria-hidden />
        People
      </h1>

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {(urows ?? []).map((r) => {
          const id = r.id as string;
          const isFollowing = following.has(id);
          return (
            <li
              key={id}
              className="flex items-center justify-between gap-2 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {(r.display_name as string)?.trim() || "—"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {(r.email as string) || ""}
                </p>
              </div>
              <FollowToggle userId={id} isFollowing={isFollowing} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
