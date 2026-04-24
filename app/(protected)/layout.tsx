import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
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
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-0 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
