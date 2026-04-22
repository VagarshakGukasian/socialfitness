import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-[var(--background)]/95 backdrop-blur dark:border-zinc-800">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link
            href="/challenges"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Social Fitness
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link href="/challenges" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Челленджи
            </Link>
            <Link href="/teams" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Команды
            </Link>
            <Link href="/profile" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Профиль
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Панель
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                Выйти
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
