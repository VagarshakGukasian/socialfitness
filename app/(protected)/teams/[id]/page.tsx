import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, created_by, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!team) notFound();

  const { data: memberCheck } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memberCheck) notFound();

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id);

  const memberIds = (memberRows ?? []).map((m) => m.user_id as string);
  let nameByUser: Record<string, string> = {};
  if (memberIds.length) {
    const { data: profs } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", memberIds);
    for (const p of profs ?? []) {
      nameByUser[p.id as string] =
        (p.display_name as string) ?? `${(p.id as string).slice(0, 8)}…`;
    }
  }

  const { data: enrollments } = await supabase
    .from("team_challenge_enrollments")
    .select("challenge_id, completed_at, challenges(id, title)")
    .eq("team_id", id);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link
        href="/teams"
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Команды
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">{team.name}</h1>

      <div className="mt-8 space-y-6">
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Участники</h2>
            <Link
              href={`/teams/${id}/members`}
              className="text-sm font-medium text-teal-700 underline dark:text-teal-400"
            >
              Добавить людей
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {memberIds.map((uid) => (
              <li key={uid} className="text-zinc-700 dark:text-zinc-300">
                {nameByUser[uid] ?? uid.slice(0, 8) + "…"}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Челленджи команды</h2>
          <ul className="mt-3 space-y-2">
            {(enrollments ?? []).map((e) => {
              const raw = e.challenges;
              const row = Array.isArray(raw) ? raw[0] : raw;
              const ch =
                row && typeof row === "object" && "id" in row && "title" in row
                  ? (row as { id: string; title: string })
                  : null;
              if (!ch) return null;
              const active = !e.completed_at;
              return (
                <li key={ch.id}>
                  <Link
                    href={`/challenges/${ch.id}/teams/${id}/chat`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                  >
                    <span>{ch.title}</span>
                    <span className="text-zinc-500">
                      {active ? "Чат →" : "Завершён"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {(enrollments ?? []).length === 0 && (
            <p className="mt-2 text-sm text-zinc-500">
              Пока ни в одном челлендже. Вступите на странице челленджа.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
