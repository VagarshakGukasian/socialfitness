import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid, Shield } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const links: { href: string; label: string }[] = [
  { href: "/challenges", label: "Challenges" },
  { href: "/feed", label: "Feed" },
  { href: "/users", label: "People" },
  { href: "/teams", label: "Teams" },
  { href: "/profile", label: "Profile" },
  { href: "/", label: "Home" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? "";
  const isAdmin = isAdminEmail(email);
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-4 sm:py-10">
      <div className="flex items-center gap-2 text-xl font-bold">
        <LayoutGrid className="h-6 w-6 text-[var(--accent)]" />
        Hub
      </div>
      <p className="text-sm text-zinc-500">Hi, {name.split("@")[0]}</p>

      <nav
        className="flex flex-wrap gap-2"
        aria-label="Shortcuts"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
          >
            {l.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin/challenges"
            className="inline-flex items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
        )}
      </nav>
    </div>
  );
}
