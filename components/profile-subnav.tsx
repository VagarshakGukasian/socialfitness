"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ListChecks, UserRound } from "lucide-react";

const tabs = [
  { href: "/profile", label: "You", Icon: UserRound, exact: true },
  { href: "/profile/challenges", label: "Challenges", Icon: ListChecks, exact: false },
  { href: "/profile/activity", label: "Posts", Icon: Activity, exact: false },
] as const;

export function ProfileSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="mb-6 flex gap-1 rounded-2xl border border-zinc-200 p-1 dark:border-zinc-800"
      aria-label="Profile sections"
    >
      {tabs.map(({ href, label, Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
