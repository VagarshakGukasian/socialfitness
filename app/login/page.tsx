import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      {params.error === "oauth" && (
        <p className="mb-6 max-w-sm rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          Google sign-in failed. Try again or use email and password.
        </p>
      )}
      <AuthForm mode="login" />
    </div>
  );
}
