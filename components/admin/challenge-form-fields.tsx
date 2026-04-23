import type { ChallengeRow } from "@/lib/types/challenge";

export function ChallengeFormFields({
  challenge,
}: {
  challenge?: ChallengeRow | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Название *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={challenge?.title ?? ""}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Slug (латиница, URL) *
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={challenge?.slug ?? ""}
          placeholder="naprimer-30-dney-pressa (пусто — сгенерируется)"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Уникальный идентификатор в адресе; только a-z, 0-9 и дефис.
        </p>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={challenge?.description ?? ""}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor="image_url" className="block text-sm font-medium">
          URL картинки
        </label>
        <input
          id="image_url"
          name="image_url"
          defaultValue={challenge?.image_url ?? ""}
          placeholder="/challenges/30-day-abs-cover.svg или https://…"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="duration_days" className="block text-sm font-medium">
            Длительность (дней)
          </label>
          <input
            id="duration_days"
            name="duration_days"
            type="number"
            min={1}
            defaultValue={challenge?.duration_days ?? 30}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label htmlFor="interval_days" className="block text-sm font-medium">
            Посты челленджа каждые N дней
          </label>
          <input
            id="interval_days"
            name="interval_days"
            type="number"
            min={1}
            defaultValue={challenge?.interval_days ?? 1}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>
    </div>
  );
}
