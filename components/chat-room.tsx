"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { postTeamChatForm } from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/client";

export type ChatMessageVM = {
  id: string;
  is_official: boolean;
  body: string;
  created_at: string;
  author_id: string | null;
  author_name: string | null;
  team_id?: string | null;
  other_team_label?: string | null;
  reactions: { emoji: string; user_id: string }[];
  attachments?: { url: string; mimeType: string | null }[];
};

const QUICK_EMOJI = ["👍", "🔥", "💪", "❤️", "😂"];

const MAX_ATTACHMENTS = 3;

function isVideoMime(m: string | null | undefined) {
  if (!m) return false;
  return m.startsWith("video/");
}

export function ChatRoom({
  challengeId,
  teamId,
  currentUserId,
  initialMessages,
  filterTeamsOnly = true,
  teamNameLabel = "Team",
  allFeedHref,
  teamOnlyHref,
}: {
  challengeId: string;
  teamId: string;
  currentUserId: string;
  initialMessages: ChatMessageVM[];
  filterTeamsOnly?: boolean;
  teamNameLabel?: string;
  allFeedHref: string;
  teamOnlyHref: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function send() {
    if (sending) return;
    const t = text.trim();
    if (!t && files.length === 0) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.set("challenge_id", challengeId);
      fd.set("team_id", teamId);
      fd.set("body", t);
      for (const f of files.slice(0, MAX_ATTACHMENTS)) {
        fd.append("attachments", f);
      }
      await postTeamChatForm(fd);
      setText("");
      setFiles([]);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_ATTACHMENTS) break;
      next.push(f);
    }
    setFiles(next);
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

  const inAllMode = !filterTeamsOnly;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex rounded-2xl border border-zinc-200 p-1 dark:border-zinc-800">
        <Link
          href={teamOnlyHref}
          className={`flex-1 rounded-xl py-2 text-center text-xs font-semibold ${
            filterTeamsOnly
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500"
          }`}
        >
          {teamNameLabel}
        </Link>
        <Link
          href={allFeedHref}
          className={`flex-1 rounded-xl py-2 text-center text-xs font-semibold ${
            inAllMode
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500"
          }`}
        >
          All
        </Link>
      </div>

      <ul className="flex max-h-[min(64vh,520px)] flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-4">
        {initialMessages.map((m) => {
          const atts = m.attachments ?? [];
          const bodyText = m.body.trim();
          const showBody = bodyText.length > 0;
          return (
            <li
              key={m.id}
              className={`rounded-xl px-3 py-2 ${
                m.is_official
                  ? "border border-teal-200 bg-teal-50/90 dark:border-teal-900 dark:bg-teal-950/50"
                  : "bg-white dark:bg-zinc-950"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-zinc-500">
                <span className="flex flex-wrap items-center gap-1.5">
                  {m.is_official ? (
                    <strong className="text-teal-800 dark:text-teal-200">
                      Challenge
                    </strong>
                  ) : (
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {m.author_name ?? "Member"}
                    </strong>
                  )}
                  {m.other_team_label && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                      {m.other_team_label}
                    </span>
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
              {showBody && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                  {bodyText}
                </p>
              )}
              {atts.length > 0 && (
                <ul className="mt-2 flex flex-col gap-2">
                  {atts.map((a) =>
                    isVideoMime(a.mimeType) ? (
                      <li key={a.url}>
                        <video
                          src={a.url}
                          controls
                          className="max-h-64 w-full rounded-lg bg-black object-contain"
                          preload="metadata"
                        >
                          <track kind="captions" />
                        </video>
                      </li>
                    ) : (
                      <li
                        key={a.url}
                        className="relative max-h-64 w-full max-w-md overflow-hidden rounded-lg"
                      >
                        <Image
                          src={a.url}
                          alt=""
                          width={640}
                          height={400}
                          className="h-auto max-h-64 w-full object-contain"
                          unoptimized={a.url.startsWith("/")}
                        />
                      </li>
                    )
                  )}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {reactionSummary(m.reactions).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleReaction(m.id, emoji)}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <span>{emoji}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {count}
                    </span>
                  </button>
                ))}
                <span className="ml-1 flex gap-0.5">
                  {QUICK_EMOJI.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleReaction(m.id, e)}
                      className="rounded px-1 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {e}
                    </button>
                  ))}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2">
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
              >
                <span className="max-w-[10rem] truncate">{f.name}</span>
                <button
                  type="button"
                  className="text-zinc-500 hover:text-zinc-900"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label="Remove attachment"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message your team…"
            rows={2}
            className="min-h-[44px] min-w-[12rem] flex-1 resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex shrink-0 flex-col gap-2 self-end">
            <label className="cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900">
              Media
              <input
                type="file"
                accept="image/*,video/*,.heic"
                multiple
                className="hidden"
                disabled={files.length >= MAX_ATTACHMENTS}
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              disabled={sending}
              onClick={send}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500">
          Up to {MAX_ATTACHMENTS} photos or videos (≈25 MB each).
        </p>
      </div>
    </div>
  );
}
