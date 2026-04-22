import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChallengeEnroll } from "@/components/challenge-enroll";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!challenge) notFound();

  const { data: statsRaw } = await supabase.rpc("challenge_participant_stats", {
    p_challenge_id: id,
  });
  const statsRow = Array.isArray(statsRaw) ? statsRaw[0] : statsRaw;
  const stats = {
    active_users: statsRow ? Number(statsRow.active_users) : 0,
    completed_users: statsRow ? Number(statsRow.completed_users) : 0,
  };

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const myTeamIds = (memberships ?? []).map((m) => m.team_id as string);

  let enrolledTeamIds: string[] = [];
  if (myTeamIds.length) {
    const { data: enr } = await supabase
      .from("team_challenge_enrollments")
      .select("team_id")
      .eq("challenge_id", id)
      .in("team_id", myTeamIds);
    enrolledTeamIds = (enr ?? []).map((e) => e.team_id as string);
  }

  const availableTeamIds = myTeamIds.filter((tid) => !enrolledTeamIds.includes(tid));

  let teamsForEnroll: { id: string; name: string }[] = [];
  if (availableTeamIds.length) {
    const { data: teamRows } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", availableTeamIds);
    teamsForEnroll = (teamRows ?? []) as { id: string; name: string }[];
  }

  const { data: enrolledTeamsData } = enrolledTeamIds.length
    ? await supabase.from("teams").select("id, name").in("id", enrolledTeamIds)
    : { data: [] };

  const enrolledTeams = (enrolledTeamsData ?? []) as { id: string; name: string }[];

  const src =
    challenge.image_url?.startsWith("/") ? challenge.image_url : challenge.image_url || "/challenges/30-day-abs-cover.svg";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link
        href="/challenges"
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Все челленджи
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        {challenge.title}
      </h1>
      {challenge.description && (
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {challenge.description}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-6 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          Сейчас проходят:{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {stats.active_users}
          </strong>{" "}
          чел.
        </span>
        <span>
          Прошли:{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {stats.completed_users}
          </strong>{" "}
          чел.
        </span>
        <span>
          Посты: раз в {challenge.interval_days}{" "}
          {challenge.interval_days === 1 ? "день" : "дн."}
        </span>
      </div>

      <div className="mt-10 space-y-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Участие</h2>
        {enrolledTeams.length > 0 ? (
          <ul className="space-y-3">
            {enrolledTeams.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/40"
              >
                <span className="font-medium">{t.name}</span>
                <Link
                  href={`/challenges/${id}/teams/${t.id}/chat`}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Чат команды
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            Вы ещё не вступили в этот челлендж ни с одной командой.
          </p>
        )}

        <ChallengeEnroll challengeId={id} teams={teamsForEnroll} />
      </div>
    </div>
  );
}
