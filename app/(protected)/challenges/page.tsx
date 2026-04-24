import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Flame } from "lucide-react";
import { getChallengeJoinWindow } from "@/lib/challenge-schedule";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeRow } from "@/lib/types/challenge";

export default async function ChallengesPage() {
  const supabase = await createClient();
  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: true });

  const list = (challenges ?? []) as ChallengeRow[];

  const statsById: Record<
    string,
    { active_users: number; completed_users: number }
  > = {};

  for (const c of list) {
    const { data } = await supabase.rpc("challenge_participant_stats", {
      p_challenge_id: c.id,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (row && typeof row === "object" && "active_users" in row) {
      statsById[c.id] = {
        active_users: Number(row.active_users),
        completed_users: Number(row.completed_users),
      };
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:py-8">
      <div className="flex items-end gap-2">
        <Flame className="h-8 w-8 text-[var(--accent)]" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Challenges
        </h1>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {list.map((c) => {
          const stats = statsById[c.id] ?? {
            active_users: 0,
            completed_users: 0,
          };
          const src = c.image_url?.startsWith("/")
            ? c.image_url
            : c.image_url || "/challenges/30-day-abs-cover.svg";

          const dayWord = c.interval_days === 1 ? "day" : "days";
          const jw = getChallengeJoinWindow({
            schedule_mode: c.schedule_mode ?? "evergreen",
            window_start: c.window_start ?? null,
            window_end: c.window_end ?? null,
          });
          const jLabel =
            jw === "open"
              ? { t: "Open", cl: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" }
              : jw === "upcoming"
                ? { t: "Soon", cl: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200" }
                : { t: "Closed", cl: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" };

          return (
            <li key={c.id}>
              <Link
                href={`/challenges/${c.id}`}
                className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="relative aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover transition group-active:scale-[1.01]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="line-clamp-1 flex-1 text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {c.title}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${jLabel.cl}`}
                    >
                      {jLabel.t}
                    </span>
                  </div>
                  {c.description && (
                    <p className="line-clamp-2 text-sm text-zinc-500">
                      {c.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {c.interval_days}d cycle
                    </span>
                    {c.duration_days && (
                      <span className="inline-flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        {c.duration_days}d program
                      </span>
                    )}
                    <span>
                      {stats.active_users} in · {stats.completed_users} done
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {list.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">Nothing here yet.</p>
      )}
    </div>
  );
}
