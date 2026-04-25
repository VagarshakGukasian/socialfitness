import { AppTopNav } from "@/components/app-top-nav";
import { BottomNav } from "@/components/bottom-nav";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Renders on every protected route. Keeps the nav bar in the same tree as
 * the page (plus server HTML for all links) — reliable on Vercel.
 */
export default async function ProtectedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Layout already enforces session; this is a safety fallback.
  const isAdmin = user?.email ? isAdminEmail(user.email) : false;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppTopNav isAdmin={isAdmin} />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-0 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
