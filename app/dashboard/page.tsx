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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Панель</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Вы вошли как{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}
      >
        <button
          type="submit"
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Выйти
        </button>
      </form>

      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-4">
          На главную
        </Link>
      </p>
    </div>
  );
}
