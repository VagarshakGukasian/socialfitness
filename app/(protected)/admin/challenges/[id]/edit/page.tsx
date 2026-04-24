import Link from "next/link";
import { notFound } from "next/navigation";
import { adminUpdateChallenge } from "@/app/actions/admin-challenges";
import { ChallengeFormFields } from "@/components/admin/challenge-form-fields";
import { AdminDeleteChallengeForm } from "@/components/admin/delete-challenge-form";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeRow } from "@/lib/types/challenge";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditChallengePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const challenge = data as ChallengeRow;

  async function updateAction(formData: FormData) {
    "use server";
    await adminUpdateChallenge(id, formData);
  }

  return (
    <div>
      <Link
        href="/admin/challenges"
        className="text-sm text-amber-900 underline dark:text-amber-200"
      >
        ← Back to list
      </Link>
      <h1 className="mt-4 text-xl font-semibold">Edit</h1>
      <p className="mt-1 text-sm text-zinc-500">{challenge.title}</p>

      <form
        action={updateAction}
        encType="multipart/form-data"
        className="mt-8 max-w-xl space-y-6"
      >
        <ChallengeFormFields challenge={challenge} />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            Save
          </button>
          <Link
            href={`/challenges/${challenge.id}`}
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm dark:border-zinc-600"
          >
            View as user
          </Link>
        </div>
      </form>

      <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Deleting removes the challenge, team enrollments, messages, and
          reactions (cascaded in the database).
        </p>
        <div className="mt-4">
          <AdminDeleteChallengeForm challengeId={id} title={challenge.title} />
        </div>
      </div>
    </div>
  );
}
