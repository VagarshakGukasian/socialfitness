import { redirect } from "next/navigation";
import { ProtectedChrome } from "@/components/protected-chrome";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

/** Vercel: never cache the authed shell without the nav. */
export const dynamic = "force-dynamic";

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

  const isAdmin = isAdminEmail(user.email ?? "");

  return <ProtectedChrome isAdmin={isAdmin}>{children}</ProtectedChrome>;
}
