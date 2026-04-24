import Link from "next/link";
import { notFound } from "next/navigation";
import { AddUserToTeamButton } from "@/components/add-user-to-team-button";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function TeamBrowseUsersPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { data: memberCheck } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!team || !memberCheck) notFound();

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id);

  const memberSet = new Set(
    (memberRows ?? []).map((m) => m.user_id as string)
  );

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, display_name, email")
    .order("display_name", { ascending: true })
    .limit(500);

  const rows = allUsers ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link
        href={`/teams/${id}`}
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← {team.name}
      </Link>
      <h1 className="mt-6 text-xl font-semibold">All users</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Add people to <strong>{team.name}</strong>. They must already have an
        account.
      </p>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {rows.map((u) => {
          const uid = u.id as string;
          const name =
            (u.display_name as string | null)?.trim() || "—";
          const email = (u.email as string | null)?.trim() || "—";
          return (
            <li
              key={uid}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {name}
                </p>
                <p className="text-sm text-zinc-500">{email}</p>
              </div>
              <AddUserToTeamButton
                teamId={id}
                userId={uid}
                alreadyMember={memberSet.has(uid)}
              />
            </li>
          );
        })}
      </ul>

      {rows.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No users yet.</p>
      )}
    </div>
  );
}
