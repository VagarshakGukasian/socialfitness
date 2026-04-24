import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileChallengesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tmem } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);
  const teamIds = (tmem ?? []).map((m) => m.team_id as string);
  const { data: enrollRows } = teamIds.length
    ? await supabase
        .from("team_challenge_enrollments")
        .select("team_id, challenge_id, completed_at, challenges(id, title)")
        .in("team_id", teamIds)
    : { data: [] };

  const { data: teams } = teamIds.length
    ? await supabase.from("teams").select("id, name, is_solo").in("id", teamIds)
    : { data: [] };
  const teamName: Record<string, string> = {};
  for (const t of teams ?? []) {
    teamName[t.id as string] = t.is_solo
      ? "You"
      : ((t.name as string) || "Team");
  }

  const active = (enrollRows ?? []).filter((e) => !e.completed_at);
  const done = (enrollRows ?? []).filter((e) => e.completed_at);

  return (
    <div>
      <h2 className="text-lg font-bold">Challenges</h2>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Active
      </h3>
      <ul className="mt-2 space-y-2">
        {active.map((e) => {
          const raw = e.challenges;
          const ch = Array.isArray(raw) ? raw[0] : raw;
          if (!ch || typeof ch !== "object" || !("id" in ch)) return null;
          const c = ch as { id: string; title: string };
          return (
            <li key={`${e.challenge_id as string}-${e.team_id as string}`}>
              <Link
                href={`/challenges/${c.id}/teams/${e.team_id}/chat`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium dark:border-zinc-800"
              >
                <span className="min-w-0 truncate">{c.title}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {teamName[e.team_id as string] ?? ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {active.length === 0 && (
        <p className="mt-2 text-sm text-zinc-500">No active right now.</p>
      )}

      <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Past
      </h3>
      <ul className="mt-2 space-y-2">
        {done.map((e) => {
          const raw = e.challenges;
          const ch = Array.isArray(raw) ? raw[0] : raw;
          if (!ch || typeof ch !== "object" || !("id" in ch)) return null;
          const c = ch as { id: string; title: string };
          return (
            <li
              key={`d-${e.challenge_id as string}-${e.team_id as string}`}
            >
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {c.title}
                </span>
                <span className="text-xs text-zinc-500">Done</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
