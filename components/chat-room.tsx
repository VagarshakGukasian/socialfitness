"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { postTeamMessage } from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/client";

export type ChatMessageVM = {
  id: string;
  is_official: boolean;
  body: string;
  created_at: string;
  author_id: string | null;
  author_name: string | null;
  reactions: { emoji: string; user_id: string }[];
};

const QUICK_EMOJI = ["👍", "🔥", "💪", "❤️", "😂"];

export function ChatRoom({
  challengeId,
  teamId,
  currentUserId,
  initialMessages,
}: {
  challengeId: string;
  teamId: string;
  currentUserId: string;
  initialMessages: ChatMessageVM[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await postTeamMessage(challengeId, teamId, t);
      setText("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const { data: existing } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", currentUserId)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: currentUserId,
        emoji,
      });
    }
    router.refresh();
  }

  function reactionSummary(rows: { emoji: string; user_id: string }[]) {
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ul className="flex max-h-[min(70vh,560px)] flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        {initialMessages.map((m) => (
          <li
            key={m.id}
            className={`rounded-xl px-3 py-2 ${
              m.is_official
                ? "border border-teal-200 bg-teal-50/90 dark:border-teal-900 dark:bg-teal-950/50"
                : "bg-white dark:bg-zinc-950"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-zinc-500">
              <span>
                {m.is_official ? (
                  <strong className="text-teal-800 dark:text-teal-200">
                    Challenge
                  </strong>
                ) : (
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {m.author_name ?? "Member"}
                  </strong>
                )}
              </span>
              <time dateTime={m.created_at}>
                {new Date(m.created_at).toLocaleString("en-US", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
              {m.body}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {reactionSummary(m.reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleReaction(m.id, emoji)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <span>{emoji}</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{count}</span>
                </button>
              ))}
              <span className="ml-1 flex gap-0.5">
                {QUICK_EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    title={e}
                    onClick={() => toggleReaction(m.id, e)}
                    className="rounded px-1 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {e}
                  </button>
                ))}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message your team…"
          rows={2}
          className="min-h-[44px] flex-1 resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="button"
          disabled={sending}
          onClick={send}
          className="self-end rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
