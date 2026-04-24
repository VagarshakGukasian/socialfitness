import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Users } from "lucide-react";
import { ChallengeEnroll } from "@/components/challenge-enroll";
import { QuitChallengeButton } from "@/components/quit-challenge-button";
import { getChallengeJoinWindow } from "@/lib/challenge-schedule";
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

  const scheduleMode = (challenge.schedule_mode as string) ?? "evergreen";
  const joinWindow = getChallengeJoinWindow({
    schedule_mode: scheduleMode,
    window_start: (challenge.window_start as string) ?? null,
    window_end: (challenge.window_end as string) ?? null,
  });
  const canJoin = joinWindow === "open";

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

  let teamsForEnroll: { id: string; name: string; is_solo: boolean }[] = [];
  if (availableTeamIds.length) {
    const { data: teamRows } = await supabase
      .from("teams")
      .select("id, name, is_solo")
      .in("id", availableTeamIds);
    teamsForEnroll = (teamRows ?? []) as { id: string; name: string; is_solo: boolean }[];
  }

  const { data: enrolledTeamsData } = enrolledTeamIds.length
    ? await supabase.from("teams").select("id, name, is_solo").in("id", enrolledTeamIds)
    : { data: [] };

  const enrolledTeams = (enrolledTeamsData ?? []) as {
    id: string;
    name: string;
    is_solo: boolean;
  }[];

  const src =
    challenge.image_url?.startsWith("/")
      ? challenge.image_url
      : challenge.image_url || "/challenges/30-day-abs-cover.svg";

  const dayWord = challenge.interval_days === 1 ? "day" : "days";
  const windowLabel =
    joinWindow === "open"
      ? { text: "Open", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200" }
      : joinWindow === "upcoming"
        ? { text: "Upcoming", className: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200" }
        : { text: "Closed", className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
      <Link
        href="/challenges"
        className="text-sm text-[var(--accent)] hover:underline"
      >
        ← All
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
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

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {challenge.title}
        </h1>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${windowLabel.className}`}
        >
          {windowLabel.text}
        </span>
      </div>
      {challenge.description && (
        <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
          {challenge.description}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {stats.active_users} active
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Every {challenge.interval_days} {dayWord}
        </span>
        {scheduleMode === "date_range" && challenge.window_start && challenge.window_end && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {String(challenge.window_start)} – {String(challenge.window_end)}
          </span>
        )}
      </div>

      <div className="mt-8 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Your teams
        </h2>
        {enrolledTeams.length > 0 ? (
          <ul className="space-y-2">
            {enrolledTeams.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">
                  {t.is_solo ? "Just you" : t.name}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/challenges/${id}/teams/${t.id}/chat`}
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Chat
                  </Link>
                  <QuitChallengeButton
                    teamId={t.id}
                    challengeId={id}
                    teamName={t.is_solo ? "Just you" : t.name}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Not in this one yet.</p>
        )}

        {canJoin && (
          <ChallengeEnroll
            challengeId={id}
            teams={teamsForEnroll}
            canJoin={canJoin}
          />
        )}
        {!canJoin && teamsForEnroll.length > 0 && (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Join is not available in this period.
          </p>
        )}
        {!canJoin && teamsForEnroll.length === 0 && enrolledTeams.length > 0 && null}
        {!canJoin && teamsForEnroll.length === 0 && enrolledTeams.length === 0 && (
          <p className="text-sm text-zinc-500">This challenge is not open for new joins.</p>
        )}
      </div>
    </div>
  );
}
