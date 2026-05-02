"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { TEAM_DEFAULT_AVATAR_URLS } from "@/lib/team-default-avatars";

export function TeamAvatarPickerFields({
  initialDefaultUrl,
  showHelp = true,
}: {
  /** When editing, pre-select a default (or current URL if it matches a default). */
  initialDefaultUrl?: string | null;
  showHelp?: boolean;
}) {
  const initialPick =
    initialDefaultUrl &&
    TEAM_DEFAULT_AVATAR_URLS.includes(
      initialDefaultUrl as (typeof TEAM_DEFAULT_AVATAR_URLS)[number]
    )
      ? initialDefaultUrl
      : "";

  const [selectedDefault, setSelectedDefault] = useState(initialPick);
  const [clearFile, setClearFile] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="team_avatar_default"
        value={selectedDefault}
      />
      <div>
        <label className="block text-sm font-medium">Team picture</label>
        <input
          key={clearFile}
          ref={fileRef}
          name="team_avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Upload overrides the chosen default. JPEG, PNG, WebP, or GIF up to 5 MB.
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Or pick a default
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEAM_DEFAULT_AVATAR_URLS.map((url) => {
            const on = selectedDefault === url;
            return (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setSelectedDefault(url);
                  setClearFile((c) => c + 1);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className={`relative h-14 w-14 overflow-hidden rounded-full border-2 transition ${
                  on
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
                aria-pressed={on}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            );
          })}
        </div>
        {showHelp && (
          <p className="mt-2 text-xs text-zinc-500">
            If you don’t pick one, a default is chosen at random when you submit.
          </p>
        )}
      </div>
    </div>
  );
}
