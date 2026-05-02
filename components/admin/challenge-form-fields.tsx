import Image from "next/image";
import { MessageTemplatesField } from "@/components/admin/message-templates-field";
import type { ChallengeRow } from "@/lib/types/challenge";

export function ChallengeFormFields({
  challenge,
  messageTemplateLines,
}: {
  challenge?: ChallengeRow | null;
  /** Body of each template in order (edit mode). Omit for one empty row in the UI. */
  messageTemplateLines?: string[];
}) {
  const sm = challenge?.schedule_mode ?? "evergreen";
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
          Title *
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
          Slug (URL, Latin) *
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={challenge?.slug ?? ""}
          placeholder="e.g. 30-day-abs (empty = auto from title)"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Unique path segment; only a-z, 0-9, and hyphens.
        </p>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
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
          Cover image
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-amber-900 dark:text-zinc-400 dark:file:bg-amber-950 dark:file:text-amber-100"
        />
        <p className="mt-1 text-xs text-zinc-500">
          JPEG, PNG, WebP, GIF, or SVG, up to 5 MB. When editing, leave empty to
          keep the current image.
        </p>
        {isRemoteOrAbsolute && previewSrc && (
          <div className="mt-3">
            <p className="mb-2 text-xs text-zinc-500">Current:</p>
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
      <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <p className="text-sm font-medium">Join window</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="schedule_mode"
              value="evergreen"
              defaultChecked={sm === "evergreen" || !challenge}
            />
            Open anytime
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="schedule_mode"
              value="date_range"
              defaultChecked={sm === "date_range"}
            />
            Fixed dates
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="window_start"
              className="block text-xs font-medium text-zinc-500"
            >
              Start
            </label>
            <input
              id="window_start"
              name="window_start"
              type="date"
              defaultValue={challenge?.window_start ?? ""}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label
              htmlFor="window_end"
              className="block text-xs font-medium text-zinc-500"
            >
              End
            </label>
            <input
              id="window_end"
              name="window_end"
              type="date"
              defaultValue={challenge?.window_end ?? ""}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Fixed dates: join only on or between start and end. Ignored for open
          anytime.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <MessageTemplatesField
          initialLines={messageTemplateLines ?? []}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="duration_days" className="block text-sm font-medium">
            Duration (days)
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
            Official posts every N days
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
