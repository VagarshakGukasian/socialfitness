import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-200 pb-4 text-sm font-medium dark:border-zinc-800">
        <Link
          href="/challenges"
          className="text-teal-700 hover:underline dark:text-teal-400"
        >
          Challenges
        </Link>
        <Link
          href="/teams"
          className="text-teal-700 hover:underline dark:text-teal-400"
        >
          Teams
        </Link>
        <Link
          href="/profile"
          className="text-teal-700 hover:underline dark:text-teal-400"
        >
          Profile
        </Link>
        {isAdmin && (
          <Link
            href="/admin/challenges"
            className="text-amber-800 hover:underline dark:text-amber-300"
          >
            Admin
          </Link>
        )}
        <Link href="/" className="text-zinc-500 hover:underline">
          Home
        </Link>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
        </p>
      </div>

      <p className="text-sm text-zinc-500">
        Use the links above to move around the app.
      </p>
    </div>
  );
}
