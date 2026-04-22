import Link from "next/link";
import { redirect } from "next/navigation";
import { createTeam } from "@/app/actions/teams";

export default function NewTeamPage() {
  async function create(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const id = await createTeam(name);
    redirect(`/teams/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <Link
        href="/teams"
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Команды
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">Новая команда</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Вы станете участником автоматически и сможете приглашать других.
      </p>
      <form action={create} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Название
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Например, Утренние богатыри"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Создать
        </button>
      </form>
    </div>
  );
}
