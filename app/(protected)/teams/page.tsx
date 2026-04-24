import Link from "next/link";
import { Plus, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: m } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);
  const tids = (m ?? []).map((x) => x.team_id as string);

  const { data: trows } = tids.length
    ? await supabase
        .from("teams")
        .select("id, name, created_at, is_solo")
        .in("id", tids)
        .eq("is_solo", false)
        .order("name", { ascending: true })
    : { data: [] };

  const teams = trows ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users2 className="h-7 w-7 text-[var(--accent)]" aria-hidden />
          Teams
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/teams/explore"
            className="text-sm font-semibold text-[var(--accent)]"
          >
            All teams
          </Link>
          <Link
            href="/teams/new"
            className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-zinc-900 px-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {teams.map((t) => (
          <li key={t.id as string}>
            <Link
              href={`/teams/${t.id}`}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/30"
            >
              <span className="font-medium">{t.name as string}</span>
              <span className="text-sm text-zinc-400">→</span>
            </Link>
          </li>
        ))}
      </ul>

      {teams.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">
          No group teams yet. Create one, or use{" "}
          <strong>Just you</strong> in challenges.
        </p>
      )}
    </div>
  );
}
