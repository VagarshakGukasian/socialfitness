"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { quitTeamChallenge } from "@/app/actions/teams";

export function QuitChallengeButton({
  teamId,
  challengeId,
  teamName,
}: {
  teamId: string;
  challengeId: string;
  teamName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (
      !confirm(
        `Remove team “${teamName}” from this challenge? Team chat history for this challenge will be deleted. This cannot be undone.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await quitTeamChallenge(teamId, challengeId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500"
    >
      {pending ? "…" : "Quit challenge"}
    </button>
  );
}
