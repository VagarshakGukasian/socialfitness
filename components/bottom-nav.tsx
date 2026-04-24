"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, Flame, UserRound } from "lucide-react";

const items = [
  { href: "/challenges", label: "Challenges", Icon: Flame },
  { href: "/feed", label: "Feed", Icon: Activity },
  { href: "/teams", label: "Teams", Icon: Building2 },
  { href: "/profile", label: "You", Icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200/90 bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom,0px)] pt-1 backdrop-blur supports-[padding:max(0px)]:pr-[max(0px,env(safe-area-inset-right))] dark:border-zinc-800 md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/challenges"
              ? pathname === "/challenges" || pathname.startsWith("/challenges/")
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 1.8}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
