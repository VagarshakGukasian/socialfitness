import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const { count: postCount } = await supabase
    .from("challenge_messages")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .eq("is_official", false);

  const { data: tmem } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);
  const tids = (tmem ?? []).map((m) => m.team_id as string);
  const activeCh =
    tids.length > 0
      ? await supabase
          .from("team_challenge_enrollments")
          .select("id", { count: "exact", head: true })
          .in("team_id", tids)
          .is("completed_at", null)
      : { count: 0 };

  const name =
    (profile?.display_name as string)?.trim() || user.email || "You";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-2xl font-bold text-[var(--accent)]">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold">{name}</h1>
          <p className="text-sm text-zinc-500">{(profile?.email as string) || user.email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 px-3 py-3 text-center dark:border-zinc-800">
          <p className="text-2xl font-bold tabular-nums">
            {postCount ?? 0}
          </p>
          <p className="text-xs font-medium text-zinc-500">Posts</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 px-3 py-3 text-center dark:border-zinc-800">
          <p className="text-2xl font-bold tabular-nums">{activeCh.count ?? 0}</p>
          <p className="text-xs font-medium text-zinc-500">Active</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-zinc-200 px-3 py-3 sm:col-span-1 dark:border-zinc-800">
          <Link
            href="/users"
            className="block text-center text-sm font-semibold text-[var(--accent)]"
          >
            Find people
          </Link>
        </div>
      </div>
    </div>
  );
}
