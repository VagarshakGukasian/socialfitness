import Image from "next/image";
import type { ChallengeRow } from "@/lib/types/challenge";

export function ChallengeFormFields({
  challenge,
}: {
  challenge?: ChallengeRow | null;
}) {
  const previewSrc = challenge?.image_url?.trim() || null;
  const isRemoteOrAbsolute =
    previewSrc &&
    (previewSrc.startsWith("http") || previewSrc.startsWith("/"));

  return (
    <div className="space-y-4">
      {challenge && (
        <input
          type="hidden"
          name="current_image_url"
          value={challenge.image_url ?? ""}
        />
      )}
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
        <label htmlFor="image" className="block text-sm font-medium">
          Обложка
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-amber-900 dark:text-zinc-400 dark:file:bg-amber-950 dark:file:text-amber-100"
        />
        <p className="mt-1 text-xs text-zinc-500">
          JPEG, PNG, WebP, GIF или SVG, до 5 МБ. При редактировании оставьте
          пустым, чтобы сохранить текущую картинку.
        </p>
        {isRemoteOrAbsolute && previewSrc && (
          <div className="mt-3">
            <p className="mb-2 text-xs text-zinc-500">Сейчас:</p>
            <div className="relative h-36 w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Image
                src={previewSrc}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 448px) 100vw, 448px"
                unoptimized={previewSrc.endsWith(".svg")}
              />
            </div>
          </div>
        )}
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
