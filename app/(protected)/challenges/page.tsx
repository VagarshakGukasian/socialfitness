import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_days: number | null;
  image_url: string | null;
  interval_days: number;
};

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
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Челленджи</h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Выберите программу. Участие оформляется от имени команды — создайте или
        вступите в команду на странице «Команды».
      </p>

      <ul className="mt-10 grid gap-8 sm:grid-cols-2">
        {list.map((c) => {
          const stats = statsById[c.id] ?? {
            active_users: 0,
            completed_users: 0,
          };
          const src = c.image_url?.startsWith("/")
            ? c.image_url
            : c.image_url || "/challenges/30-day-abs-cover.svg";

          return (
            <li key={c.id}>
              <Link
                href={`/challenges/${c.id}`}
                className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <div className="relative aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover transition group-hover:opacity-95"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="space-y-3 p-5">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {c.title}
                  </h2>
                  {c.description && (
                    <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {c.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span>
                      Сейчас проходят:{" "}
                      <strong className="text-zinc-800 dark:text-zinc-200">
                        {stats.active_users}
                      </strong>{" "}
                      чел.
                    </span>
                    <span>
                      Прошли:{" "}
                      <strong className="text-zinc-800 dark:text-zinc-200">
                        {stats.completed_users}
                      </strong>{" "}
                      чел.
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Посты челленджа каждые {c.interval_days}{" "}
                    {c.interval_days === 1 ? "день" : "дн."}
                    {c.duration_days
                      ? ` · всего ${c.duration_days} дн.`
                      : null}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {list.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">Пока нет челленджей.</p>
      )}
    </div>
  );
}
