import Link from "next/link";
import { adminCreateChallenge } from "@/app/actions/admin-challenges";
import { ChallengeFormFields } from "@/components/admin/challenge-form-fields";

export default function AdminNewChallengePage() {
  return (
    <div>
      <Link
        href="/admin/challenges"
        className="text-sm text-amber-900 underline dark:text-amber-200"
      >
        ← К списку
      </Link>
      <h1 className="mt-4 text-xl font-semibold">Новый челлендж</h1>
      <form action={adminCreateChallenge} className="mt-8 max-w-xl space-y-6">
        <ChallengeFormFields />
        <button
          type="submit"
          className="rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          Создать
        </button>
      </form>
    </div>
  );
}
