import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListChecks, UserRound, Users2 } from "lucide-react";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { TeamAvatarPickerFields } from "@/components/team-avatar-picker";
import { updateTeamFromForm } from "@/app/actions/teams";
import { createClient } from "@/lib/supabase/server";
import { getUserDisplayName } from "@/lib/user-display-name";
import type { User } from "@supabase/supabase-js";

type Props = { params: Promise<{ id: string }> };

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, created_by, created_at, is_solo, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (!team) notFound();

  const { data: memberCheck } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memberCheck) notFound();

  const isSolo = Boolean((team as { is_solo?: boolean }).is_solo);
  const createdBy = team.created_by as string;
  const isCreator = createdBy === user.id;
  const avatarUrl = (team.avatar_url as string | null)?.trim() || null;

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id);

  const memberIds = (memberRows ?? []).map((m) => m.user_id as string);
  const nMembers = memberIds.length;
  type Profile = { display_name: string | null; email: string | null };
  let profileByUser: Record<string, Profile> = {};
  if (memberIds.length) {
    const { data: profs } = await supabase
      .from("users")
      .select("id, display_name, email")
      .in("id", memberIds);
    for (const p of profs ?? []) {
      profileByUser[p.id as string] = {
        display_name: p.display_name as string | null,
        email: p.email as string | null,
      };
    }
  }

  const { data: enrollments } = await supabase
    .from("team_challenge_enrollments")
    .select("challenge_id, completed_at, challenges(id, title)")
    .eq("team_id", id);

  const eList = enrollments ?? [];
  const nActive = eList.filter((e) => !e.completed_at).length;
  const nDone = eList.filter((e) => e.completed_at).length;

  const authUser = user as User;

  async function saveTeamSettings(formData: FormData) {
    "use server";
    await updateTeamFromForm(formData);
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 sm:py-8">
      <Link href="/teams" className="text-sm text-[var(--accent)]">
        ← Teams
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        {avatarUrl && !isSolo && (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized={avatarUrl.startsWith("/")}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">
            {isSolo ? "Just you" : (team.name as string)}
          </h1>
          {isSolo && (
            <p className="mt-1 text-sm text-zinc-500">Private · not listed</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium dark:border-zinc-700">
          <Users2 className="h-3.5 w-3.5" />
          {nMembers} {nMembers === 1 ? "person" : "people"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium dark:border-zinc-700">
          <ListChecks className="h-3.5 w-3.5" />
          {nActive} active
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium dark:border-zinc-700">
          {nDone} done
        </span>
      </div>

      {isCreator && !isSolo && (
        <section className="mt-8 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
            Team settings
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            You can rename the team, change its picture, and add or remove people
            below.
          </p>
          <form action={saveTeamSettings} encType="multipart/form-data" className="mt-4 space-y-4">
            <input type="hidden" name="team_id" value={id} />
            <div>
              <label htmlFor="team-name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="team-name"
                name="name"
                required
                defaultValue={team.name as string}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <TeamAvatarPickerFields
              initialDefaultUrl={avatarUrl}
              showHelp={false}
            />
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Save changes
            </button>
          </form>
        </section>
      )}

      <div className="mt-8 space-y-8">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-zinc-500">
              <UserRound className="h-4 w-4" />
              People
            </h2>
            {!isSolo && (
              <div className="flex gap-3 text-sm font-semibold text-[var(--accent)]">
                {isCreator && (
                  <Link href={`/teams/${id}/members`}>Search</Link>
                )}
                <Link href={`/teams/${id}/users`}>Directory</Link>
              </div>
            )}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {memberIds.map((uid) => {
              const prof = profileByUser[uid];
              const sessionLabel =
                uid === user.id ? getUserDisplayName(authUser) : null;
              const sessionEmail =
                uid === user.id ? (authUser.email ?? "").trim() : null;
              const name =
                prof?.display_name?.trim() || sessionLabel || "Member";
              const email = prof?.email?.trim() || sessionEmail || "—";
              const canRemove =
                !isSolo && isCreator && uid !== user.id;
              return (
                <li
                  key={uid}
                  className="flex items-start justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {name}
                    </p>
                    <p className="truncate text-zinc-500">{email}</p>
                  </div>
                  {canRemove && (
                    <RemoveMemberButton
                      teamId={id}
                      userId={uid}
                      label={name}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
            Challenges
          </h2>
          <ul className="mt-3 space-y-2">
            {eList.map((e) => {
              const raw = e.challenges;
              const row = Array.isArray(raw) ? raw[0] : raw;
              const ch =
                row && typeof row === "object" && "id" in row && "title" in row
                  ? (row as { id: string; title: string })
                  : null;
              if (!ch) return null;
              const active = !e.completed_at;
              return (
                <li key={ch.id}>
                  <Link
                    href={`/challenges/${ch.id}/teams/${id}/chat`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium dark:border-zinc-800"
                  >
                    <span className="min-w-0 truncate">{ch.title}</span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {active ? "Chat →" : "Done"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {eList.length === 0 && (
            <p className="mt-2 text-sm text-zinc-500">
              Join from a challenge.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
