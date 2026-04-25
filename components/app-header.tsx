import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { DASHBOARD_NAV_LINKS } from "@/lib/dashboard-nav";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const email = user.email ?? "";
  const isAdmin = isAdminEmail(email);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/90 bg-[var(--background)]/95 backdrop-blur dark:border-zinc-800/90">
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        <div className="flex h-11 items-center justify-between gap-2">
          <Link
            href="/challenges"
            className="shrink-0 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Soc<span className="text-[var(--accent)]">Fit</span>
          </Link>
          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              className="inline-flex rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
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
