"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addTeamMember } from "@/app/actions/teams";

export function AddUserToTeamButton({
  teamId,
  userId,
  alreadyMember,
}: {
  teamId: string;
  userId: string;
  alreadyMember: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAdd() {
    setPending(true);
    setError(null);
    try {
      await addTeamMember(teamId, userId);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (alreadyMember) {
    return (
      <span className="text-xs text-zinc-500">In team</span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onAdd}
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "…" : "Add to team"}
      </button>
      {error && (
        <span className="max-w-[12rem] text-right text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
