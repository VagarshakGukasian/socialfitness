import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("challenge_messages")
    .select("id, body, created_at, challenge_id, challenges!inner(id, title)")
    .eq("author_id", user.id)
    .eq("is_official", false)
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div>
      <h2 className="text-lg font-bold">Your posts</h2>
      <ul className="mt-4 space-y-2">
        {(rows ?? []).map((r) => {
          const ch = r.challenges as
            | { id: string; title: string }
            | { id: string; title: string }[]
            | null;
          const c = Array.isArray(ch) ? ch[0] : ch;
          return (
            <li
              key={r.id as string}
              className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800"
            >
              {c && (
                <p className="text-xs text-zinc-500">
                  <Link
                    className="font-medium text-[var(--accent)]"
                    href={`/challenges/${c.id}`}
                  >
                    {c.title}
                  </Link>
                </p>
              )}
              <p className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {r.body as string}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(r.created_at as string).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </li>
          );
        })}
      </ul>
      {(!rows || rows.length === 0) && (
        <p className="mt-4 text-sm text-zinc-500">No practice posts yet.</p>
      )}
    </div>
  );
}
