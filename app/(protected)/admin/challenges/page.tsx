import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminDeleteChallengeForm } from "@/components/admin/delete-challenge-form";
import type { ChallengeRow } from "@/lib/types/challenge";

export default async function AdminChallengesListPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ChallengeRow[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Challenges</h1>
        <Link
          href="/admin/challenges/new"
          className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          Add
        </Link>
      </div>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {rows.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-zinc-500">
                {c.slug} · id: {c.id.slice(0, 8)}…
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/challenges/${c.id}/edit`}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              >
                Edit
              </Link>
              <AdminDeleteChallengeForm challengeId={c.id} title={c.title} />
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">No challenges yet.</p>
      )}

      <p className="mt-10 text-xs text-zinc-500">
        Direct URL for this page:{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
          /admin/challenges
        </code>
        — only available if your email is listed in{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
          ADMIN_EMAILS
        </code>
        .
      </p>
    </div>
  );
}
