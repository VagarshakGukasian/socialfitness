import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChatRoom,
  type ChatMessageVM,
} from "@/components/chat-room";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string; teamId: string }>;
};

export default async function TeamChallengeChatPage({ params }: Props) {
  const { id: challengeId, teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: access } = await supabase.rpc("user_can_access_team_challenge_chat", {
    p_user_id: user.id,
    p_challenge_id: challengeId,
    p_team_id: teamId,
  });

  if (!access) notFound();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("title")
    .eq("id", challengeId)
    .maybeSingle();

  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .maybeSingle();

  const { data: rawMessages } = await supabase
    .from("challenge_messages")
    .select("id, is_official, body, created_at, author_id")
    .eq("challenge_id", challengeId)
    .or(`is_official.eq.true,team_id.eq.${teamId}`)
    .order("created_at", { ascending: true });

  const messages = rawMessages ?? [];
  const authorIds = [
    ...new Set(
      messages
        .map((m) => m.author_id)
        .filter((x): x is string => Boolean(x))
    ),
  ];

  let nameById: Record<string, string> = {};
  if (authorIds.length) {
    const { data: profs } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", authorIds);
    for (const p of profs ?? []) {
      nameById[p.id as string] = (p.display_name as string) ?? "Участник";
    }
  }

  const messageIds = messages.map((m) => m.id);
  let reactionsByMessage: Record<string, { emoji: string; user_id: string }[]> =
    {};
  if (messageIds.length) {
    const { data: reacts } = await supabase
      .from("message_reactions")
      .select("message_id, emoji, user_id")
      .in("message_id", messageIds);
    for (const r of reacts ?? []) {
      const mid = r.message_id as string;
      if (!reactionsByMessage[mid]) reactionsByMessage[mid] = [];
      reactionsByMessage[mid].push({
        emoji: r.emoji as string,
        user_id: r.user_id as string,
      });
    }
  }

  const vms: ChatMessageVM[] = messages.map((m) => ({
    id: m.id as string,
    is_official: Boolean(m.is_official),
    body: m.body as string,
    created_at: m.created_at as string,
    author_id: (m.author_id as string | null) ?? null,
    author_name: m.author_id ? nameById[m.author_id as string] ?? null : null,
    reactions: reactionsByMessage[m.id as string] ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <Link
        href={`/challenges/${challengeId}`}
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← {challenge?.title ?? "Челлендж"}
      </Link>
      <h1 className="mt-4 text-xl font-semibold">
        Чат: {team?.name ?? "Команда"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Сообщения челленджа и переписка вашей команды в одной ленте.
      </p>

      <div className="mt-6 flex-1">
        <ChatRoom
          challengeId={challengeId}
          teamId={teamId}
          currentUserId={user.id}
          initialMessages={vms}
        />
      </div>
    </div>
  );
}
