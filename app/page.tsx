import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Social Fitness
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Челленджи и тренировки вместе
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Вход и регистрация уже работают — откройте страницу входа или панель, если вы
          авторизованы.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <>
              <Link
                href="/challenges"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-8 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Челленджи
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Панель
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-8 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Войти
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
