"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { addTeamMember } from "@/app/actions/teams";
import { createClient } from "@/lib/supabase/client";

type UserRow = { id: string; display_name: string | null; email: string | null };

export function TeamMemberSearch({
  teamId,
  existingUserIds,
}: {
  teamId: string;
  existingUserIds: string[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existing = useMemo(() => new Set(existingUserIds), [existingUserIds]);

  async function search() {
    const term = q.trim();
    if (term.length < 2) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("users")
      .select("id, display_name, email")
      .or(`display_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(25);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setUsers((data ?? []) as UserRow[]);
  }

  async function add(userId: string) {
    setAdding(userId);
    setError(null);
    try {
      await addTeamMember(teamId, userId);
      router.refresh();
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name or email (min 2 characters)"
          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <ul className="space-y-2">
        {users.map((u) => {
          const inTeam = existing.has(u.id);
          const name = u.display_name?.trim() || "—";
          const email = u.email?.trim() || "—";
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-zinc-500">{email}</p>
              </div>
              {inTeam ? (
                <span className="text-xs text-zinc-500">In team</span>
              ) : (
                <button
                  type="button"
                  disabled={adding === u.id}
                  onClick={() => add(u.id)}
                  className="text-sm font-medium text-teal-700 dark:text-teal-400"
                >
                  {adding === u.id ? "…" : "Add"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
