"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enrollTeamInChallenge } from "@/app/actions/teams";

type TeamOption = { id: string; name: string; is_solo: boolean };

export function ChallengeEnroll({
  challengeId,
  teams,
  canJoin = true,
}: {
  challengeId: string;
  teams: TeamOption[];
  canJoin?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canJoin) return null;

  if (teams.length === 0) {
    return null;
  }

  function displayName(t: TeamOption) {
    return t.is_solo ? "Just you" : t.name;
  }

  async function submit() {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      await enrollTeamInChallenge(teamId, challengeId);
      setOpen(false);
      router.refresh();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Could not join";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setError("Already in with this team.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] sm:w-auto"
        >
          Join
        </button>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm font-medium">Who joins?</p>
          {teams.length > 1 ? (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="mt-3 w-full min-h-11 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {displayName(t)}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {teams[0].is_solo && <User className="h-4 w-4 shrink-0" aria-hidden />}
              <span>{displayName(teams[0])}</span>
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
