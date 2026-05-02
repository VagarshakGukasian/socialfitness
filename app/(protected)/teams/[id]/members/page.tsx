import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamMemberSearch } from "@/components/team-member-search";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function TeamMembersPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: team } = await supabase
    .from("teams")
    .select("name, created_by, is_solo")
    .eq("id", id)
    .maybeSingle();

  const { data: memberCheck } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!team || !memberCheck) notFound();
  if (team.is_solo || team.created_by !== user.id) notFound();

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id);

  const existingUserIds = (members ?? []).map((m) => m.user_id as string);

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <Link
        href={`/teams/${id}`}
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← {team.name}
      </Link>
      <h1 className="mt-6 text-xl font-semibold">Add to team</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Search by display name. The person must already have an account.
      </p>
      <div className="mt-8">
        <TeamMemberSearch teamId={id} existingUserIds={existingUserIds} />
      </div>
    </div>
  );
}
