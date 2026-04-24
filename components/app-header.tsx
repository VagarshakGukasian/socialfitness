import Link from "next/link";
import { LogOut, Users } from "lucide-react";
import { signOut } from "@/app/actions/auth";
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
    <header className="sticky top-0 z-20 border-b border-zinc-200/90 bg-[var(--background)]/90 backdrop-blur dark:border-zinc-800/90">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-3 px-3 sm:px-4">
        <Link
          href="/challenges"
          className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Soc<span className="text-[var(--accent)]">Fit</span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-end gap-1 sm:flex sm:gap-2 md:gap-3"
          aria-label="Sections"
        >
          <HeaderLink href="/challenges">Challenges</HeaderLink>
          <HeaderLink href="/feed">Feed</HeaderLink>
          <Link
            href="/users"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="People"
          >
            <Users className="h-4 w-4" aria-hidden />
            <span className="hidden lg:inline">People</span>
          </Link>
          <HeaderLink href="/teams">Teams</HeaderLink>
          <HeaderLink href="/dashboard">Hub</HeaderLink>
          {isAdmin && (
            <Link
              href="/admin/challenges"
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100/80 dark:text-amber-200 dark:hover:bg-amber-950/50"
            >
              Admin
            </Link>
          )}
          <HeaderLink href="/profile">Profile</HeaderLink>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/users"
            className="inline-flex rounded-lg p-2 text-zinc-600 sm:hidden dark:text-zinc-400"
            aria-label="People"
          >
            <Users className="h-5 w-5" />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}
