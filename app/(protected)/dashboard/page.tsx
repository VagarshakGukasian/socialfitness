import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? "";
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Панель</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Вы вошли как{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        <li>
          <Link
            href="/challenges"
            className="font-medium text-teal-700 underline underline-offset-4 dark:text-teal-400"
          >
            Перейти к челленджам
          </Link>
        </li>
        <li>
          <Link
            href="/teams"
            className="font-medium text-teal-700 underline underline-offset-4 dark:text-teal-400"
          >
            Мои команды
          </Link>
        </li>
        <li>
          <Link
            href="/profile"
            className="font-medium text-teal-700 underline underline-offset-4 dark:text-teal-400"
          >
            Профиль и участие
          </Link>
        </li>
      </ul>

      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-4">
          На главную
        </Link>
      </p>
    </div>
  );
}
