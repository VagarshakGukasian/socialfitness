"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { removeTeamMember } from "@/app/actions/teams";

export function RemoveMemberButton({
  teamId,
  userId,
  label,
}: {
  teamId: string;
  userId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!confirm(`Remove ${label} from the team?`)) return;
    setPending(true);
    try {
      await removeTeamMember(teamId, userId);
      router.refresh();
    } catch {
      /* error surfaced in UI in future */
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="inline-flex rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
      aria-label={`Remove ${label}`}
    >
      {pending ? "…" : <X className="h-4 w-4" />}
    </button>
  );
}
