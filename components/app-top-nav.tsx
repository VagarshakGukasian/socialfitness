import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { DASHBOARD_NAV_LINKS } from "@/lib/dashboard-nav";

/**
 * Server-rendered top bar so links appear in the initial HTML on Vercel/SSR
 * (in addition to any client shell).
 */
export function AppTopNav({
  isAdmin,
  displayName,
}: {
  isAdmin: boolean;
  displayName: string;
}) {
  return (
    <header
      id="socfit-topnav"
      className="sticky top-0 z-[100] w-full shrink-0 border-b border-zinc-200/90 bg-white text-zinc-900 [transform:translateZ(0)] dark:border-zinc-800/90 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        <div className="flex h-11 items-center justify-between gap-2">
          <Link
            href="/challenges"
            className="shrink-0 text-base font-bold tracking-tight"
          >
            Soc<span className="text-[var(--accent)]">Fit</span>
          </Link>
          <div className="flex min-w-0 max-w-[min(100%,20rem)] items-center justify-end gap-1 sm:gap-2">
            <Link
              href="/profile"
              className="min-w-0 truncate rounded-lg px-1.5 py-1.5 text-right text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {displayName}
            </Link>
            <form action={signOut} className="shrink-0">
              <button
                type="submit"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 border-t border-zinc-200/60 py-2.5 sm:gap-x-2 dark:border-zinc-800/60"
          aria-label="App sections"
        >
          {DASHBOARD_NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 sm:px-2.5 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/challenges"
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100/80 sm:px-2.5 dark:text-amber-200 dark:hover:bg-amber-950/50"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
