import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("team_members")
    .select("team_id, teams(id, name, created_at)")
    .eq("user_id", user.id);

  const teams = (rows ?? [])
    .map((r) => {
      const t = r.teams;
      const row = Array.isArray(t) ? t[0] : t;
      if (
        row &&
        typeof row === "object" &&
        "id" in row &&
        "name" in row &&
        "created_at" in row
      ) {
        return row as { id: string; name: string; created_at: string };
      }
      return null;
    })
    .filter(Boolean) as { id: string; name: string; created_at: string }[];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <Link
          href="/teams/new"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          New team
        </Link>
      </div>

      <ul className="mt-8 space-y-3">
        {teams.map((t) => (
          <li key={t.id}>
            <Link
              href={`/teams/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <span className="font-medium">{t.name}</span>
              <span className="text-sm text-zinc-500">Open →</span>
            </Link>
          </li>
        ))}
      </ul>

      {teams.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">
          You don’t have any teams yet. Create your first one.
        </p>
      )}
    </div>
  );
}
