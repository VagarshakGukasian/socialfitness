import { notFound } from "next/navigation";
import Link from "next/link";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    notFound();
  }

  return (
    <div className="border-b border-amber-200/80 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2 text-sm">
        <span className="font-medium text-amber-950 dark:text-amber-100">
          Admin: challenges
        </span>
        <Link
          href="/admin/challenges"
          className="text-amber-900 underline underline-offset-4 dark:text-amber-200"
        >
          List
        </Link>
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-4">{children}</div>
    </div>
  );
}
