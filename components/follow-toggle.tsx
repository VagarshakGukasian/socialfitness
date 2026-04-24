"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { followUser, unfollowUser } from "@/app/actions/social";

export function FollowToggle({
  userId,
  isFollowing,
}: {
  userId: string;
  isFollowing: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function click() {
    start(async () => {
      if (isFollowing) await unfollowUser(userId);
      else await followUser(userId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={click}
      className={
        isFollowing
          ? "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold dark:border-zinc-600"
          : "rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
      }
    >
      {pending ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
