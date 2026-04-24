import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: follows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const followingIds = (follows ?? []).map((f) => f.following_id as string);

  const { data: rows } = followingIds.length
    ? await supabase
        .from("challenge_messages")
        .select(
          "id, body, created_at, challenge_id, author_id, challenges!inner(id, title)"
        )
        .eq("is_official", false)
        .in("author_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] };

  const list = rows ?? [];
  const authorIds = [
    ...new Set(list.map((r) => r.author_id as string).filter(Boolean)),
  ];
  let names: Record<string, string> = {};
  if (authorIds.length) {
    const { data: p } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", authorIds);
    for (const x of p ?? []) {
      names[x.id as string] =
        (x.display_name as string)?.trim() || "User";
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-4 sm:py-8">
      <h1 className="text-xl font-bold tracking-tight">Activity</h1>
      <p className="mt-0.5 text-sm text-zinc-500">From people you follow</p>

      <ul className="mt-6 space-y-3">
        {list.map((r) => {
          const ch = r.challenges as
            | { id: string; title: string }
            | { id: string; title: string }[]
            | null;
          const c = Array.isArray(ch) ? ch[0] : ch;
          const aid = r.author_id as string;
          return (
            <li
              key={r.id as string}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30"
            >
              <p className="text-xs font-medium text-zinc-500">
                {names[aid] ?? "…"} · {c?.title ?? "Challenge"}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-zinc-800 dark:text-zinc-200">
                {r.body as string}
              </p>
              {c && (
                <Link
                  href={`/challenges/${c.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-[var(--accent)]"
                >
                  Open
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {list.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">
          No posts yet. Follow people in{" "}
          <Link className="text-[var(--accent)]" href="/users">
            People
          </Link>
          .
        </p>
      )}
    </div>
  );
}
