"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

/** Dynamic rows; syncs to hidden `message_templates` for existing admin actions. */
export function MessageTemplatesField({ initialLines }: { initialLines: string[] }) {
  const [lines, setLines] = useState<string[]>(() =>
    initialLines.length > 0 ? initialLines : [""]
  );

  function add() {
    setLines((prev) => [...prev, ""]);
  }

  function remove(i: number) {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)
    );
  }

  const serialized = lines.join("\n");

  return (
    <div className="space-y-2">
      <input
        type="hidden"
        name="message_templates"
        value={serialized}
      />
      <p className="text-sm font-medium">Official message sequence</p>
      <p className="text-xs text-zinc-500">
        Order matters. Posts go out every N days; when the list ends, it repeats
        from the first (e.g. 1 → 2 → … → 5 → 1 → …).
      </p>
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2">
            <label className="sr-only" htmlFor={`tpl-${i}`}>
              Message {i + 1}
            </label>
            <textarea
              id={`tpl-${i}`}
              value={line}
              onChange={(e) => {
                const v = e.target.value;
                setLines((prev) =>
                  prev.map((x, idx) => (idx === i ? v : x))
                );
              }}
              rows={3}
              placeholder={`Message ${i + 1}…`}
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={lines.length <= 1}
              className="shrink-0 self-start rounded-lg border border-zinc-200 p-2 text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
              aria-label="Remove message"
            >
              <Minus className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
      >
        <Plus className="h-4 w-4" />
        Add message
      </button>
    </div>
  );
}
