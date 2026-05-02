import Link from "next/link";
import { TeamAvatarPickerFields } from "@/components/team-avatar-picker";
import { createTeamFromForm } from "@/app/actions/teams";

export default function NewTeamPage() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <Link
        href="/teams"
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Teams
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">New team</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        You’ll be added as a member automatically and can invite others.
      </p>
      <form action={createTeamFromForm} encType="multipart/form-data" className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Morning crew"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <TeamAvatarPickerFields />
        <button
          type="submit"
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create
        </button>
      </form>
    </div>
  );
}
