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
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = (memberRows ?? []).map((m) => m.team_id as string);

  let teamsById: Record<string, { name: string }> = {};
  if (teamIds.length) {
    const { data: ts } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);
    for (const t of ts ?? []) {
      teamsById[t.id as string] = { name: t.name as string };
    }
  }

  const { data: enrollRows } = teamIds.length
    ? await supabase
        .from("team_challenge_enrollments")
        .select("team_id, challenge_id, completed_at, challenges(id, title)")
        .in("team_id", teamIds)
    : { data: [] };

  const enrollments = enrollRows ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {profile?.display_name ?? user.email}
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">My teams</h2>
        <ul className="mt-3 space-y-2">
          {teamIds.map((tid) => (
            <li key={tid}>
              <Link
                href={`/teams/${tid}`}
                className="block rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
              >
                {teamsById[tid]?.name ?? tid}
              </Link>
            </li>
          ))}
        </ul>
        {teamIds.length === 0 && (
          <p className="mt-2 text-sm text-zinc-500">
            No teams yet —{" "}
            <Link href="/teams/new" className="underline">
              create one
            </Link>
            .
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Challenges by team</h2>
        <ul className="mt-3 space-y-3">
          {enrollments.map((e) => {
            const raw = e.challenges;
            const ch = Array.isArray(raw) ? raw[0] : raw;
            const challenge =
              ch && typeof ch === "object" && "id" in ch && "title" in ch
                ? (ch as { id: string; title: string })
                : null;
            const tname = teamsById[e.team_id as string]?.name ?? "Team";
            if (!challenge) return null;
            const active = !e.completed_at;
            return (
              <li
                key={`${e.team_id}-${challenge.id}`}
                className="rounded-xl border border-zinc-200 px-3 py-3 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{challenge.title}</p>
                    <p className="text-sm text-zinc-500">Team: {tname}</p>
                  </div>
                  {active ? (
                    <Link
                      href={`/challenges/${challenge.id}/teams/${e.team_id}/chat`}
                      className="text-sm font-medium text-teal-700 dark:text-teal-400"
                    >
                      Chat →
                    </Link>
                  ) : (
                    <span className="text-xs text-zinc-500">Completed</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {enrollments.length === 0 && teamIds.length > 0 && (
          <p className="mt-2 text-sm text-zinc-500">
            None of your teams are in a challenge yet.
          </p>
        )}
      </section>
    </div>
  );
}
