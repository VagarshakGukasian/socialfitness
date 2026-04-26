import { redirect } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-4 sm:py-10">
      <div className="flex items-center gap-2 text-xl font-bold">
        <LayoutGrid className="h-6 w-6 text-[var(--accent)]" />
        Hub
      </div>
      <p className="text-sm text-zinc-500">Hi, {name.split("@")[0]}</p>
    </div>
  );
}
