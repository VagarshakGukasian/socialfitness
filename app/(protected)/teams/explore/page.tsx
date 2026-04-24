import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ExploreTeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: trows } = await supabase
    .from("teams")
    .select("id, name, created_at, is_solo")
    .eq("is_solo", false)
    .order("name", { ascending: true });

  const { data: myM } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);
  const myTeams = new Set((myM ?? []).map((x) => x.team_id as string));

  const list = trows ?? [];
  const counts: Record<string, number> = {};
  for (const t of list) {
    const { count } = await supabase
      .from("team_members")
      .select("user_id", { count: "exact", head: true })
      .eq("team_id", t.id as string);
    counts[t.id as string] = count ?? 0;
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 sm:py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/teams"
          className="text-sm text-[var(--accent)]"
        >
          ← Yours
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-bold">All teams</h1>

      <ul className="mt-6 space-y-2">
        {list.map((t) => {
          const id = t.id as string;
          const member = myTeams.has(id);
          return (
            <li
              key={id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{t.name as string}</p>
                <p className="text-xs text-zinc-500">
                  {counts[id] ?? 0} members
                </p>
              </div>
              {member ? (
                <Link
                  className="text-sm font-semibold text-[var(--accent)]"
                  href={`/teams/${id}`}
                >
                  Open
                </Link>
              ) : (
                <span className="text-xs text-zinc-400">—</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
