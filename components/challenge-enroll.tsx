"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enrollTeamInChallenge } from "@/app/actions/teams";

type TeamOption = { id: string; name: string };

export function ChallengeEnroll({
  challengeId,
  teams,
}: {
  challengeId: string;
  teams: TeamOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (teams.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No teams available to join with.{" "}
        <a href="/teams/new" className="font-medium text-teal-700 underline dark:text-teal-400">
          Create a team
        </a>
        .
      </p>
    );
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
        setError("This team is already in this challenge.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Join challenge
        </button>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Which team should join?
          </p>
          {teams.length > 1 ? (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Team: <strong>{teams[0].name}</strong>
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
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
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
