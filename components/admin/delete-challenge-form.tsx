"use client";

import { useTransition } from "react";
import { adminDeleteChallenge } from "@/app/actions/admin-challenges";

export function AdminDeleteChallengeForm({
  challengeId,
  title,
}: {
  challengeId: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !confirm(
        `Delete challenge "${title}"? This cannot be undone.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await adminDeleteChallenge(challengeId);
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-900 hover:bg-red-100 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
      >
        {pending ? "…" : "Delete"}
      </button>
    </form>
  );
}
