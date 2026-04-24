-- Solo teams, challenge schedule, message templates, follows, message visibility (challenge-wide + feed).

-- ---------------------------------------------------------------------------
-- teams: one hidden "Just me" team per user (individual enroll)
-- ---------------------------------------------------------------------------
alter table public.teams
  add column if not exists is_solo boolean not null default false;

create unique index if not exists teams_one_solo_per_user
  on public.teams (created_by)
  where is_solo;

-- Hide solo teams from other users' eyes unless member
drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated" on public.teams
  for select
  to authenticated
  using (
    is_solo = false
    or public.is_team_member (teams.id, (select auth.uid ()))
  );

-- Block extra members on solo teams
create or replace function public.team_members_reject_solo_extra ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.teams t where t.id = new.team_id and t.is_solo) then
    if
      1 <= (
        select count(*)::int
        from public.team_members tm
        where tm.team_id = new.team_id
      )
    then
      raise exception 'cannot add members to a solo team';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists team_members_reject_solo_extra_trg on public.team_members;
create trigger team_members_reject_solo_extra_trg
  before insert on public.team_members
  for each row
  execute function public.team_members_reject_solo_extra ();

-- New users: app profile + solo team
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email
  );
  insert into public.teams (name, created_by, is_solo)
  values ('Just me', new.id, true);
  return new;
end;
$$;

-- One-off backfill: solo team for every user without
insert into public.teams (name, created_by, is_solo)
select 'Just me', u.id, true
from public.users u
where not exists (
  select 1
  from public.teams t
  where t.created_by = u.id
    and t.is_solo = true
)
;

-- (Trigger add_team_creator_as_member will add the owner as member for new inserts; backfill uses insert
--  which already fired trigger — only for rows inserted above, trigger from teams_after_insert_add_creator
--  runs, so we need ensure backfill members exist.)
insert into public.team_members (team_id, user_id)
select t.id, t.created_by
from public.teams t
where t.is_solo = true
  and not exists (
    select 1 from public.team_members tm
    where tm.team_id = t.id
      and tm.user_id = t.created_by
  );

-- ---------------------------------------------------------------------------
-- challenges: schedule (evergreen vs date window)
-- ---------------------------------------------------------------------------
alter table public.challenges
  add column if not exists schedule_mode text not null default 'evergreen',
  add column if not exists window_start date,
  add column if not exists window_end date;

alter table public.challenges
  drop constraint if exists challenges_schedule_mode_check;

alter table public.challenges
  add constraint challenges_schedule_mode_check
  check (schedule_mode in ('evergreen', 'date_range'));

alter table public.challenges
  drop constraint if exists challenges_window_check;

alter table public.challenges
  add constraint challenges_window_check
  check (
    schedule_mode = 'evergreen'
    or (
      window_start is not null
      and window_end is not null
      and window_end >= window_start
    )
  );

-- existing rows: already default evergreen; windows optional

-- ---------------------------------------------------------------------------
-- Official message template sequence (for admin; posting jobs use later)
-- ---------------------------------------------------------------------------
create table if not exists public.challenge_message_templates (
  id uuid primary key default gen_random_uuid (),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  position int not null,
  body text not null,
  created_at timestamptz not null default now (),
  unique (challenge_id, position)
);

create index if not exists challenge_message_templates_challenge_idx
  on public.challenge_message_templates (challenge_id, position);

alter table public.challenge_message_templates enable row level security;

create policy "challenge_message_templates_select"
  on public.challenge_message_templates for select
  to authenticated
  using (true);

grant select on public.challenge_message_templates to authenticated;
grant all on public.challenge_message_templates to service_role;

-- ---------------------------------------------------------------------------
-- Friends: asymmetric follow
-- ---------------------------------------------------------------------------
create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now (),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists user_follows_following_idx
  on public.user_follows (following_id);

alter table public.user_follows enable row level security;

create policy "user_follows_select"
  on public.user_follows for select
  to authenticated
  using (
    follower_id = (select auth.uid ())
    or following_id = (select auth.uid ())
  );

create policy "user_follows_insert_own"
  on public.user_follows for insert
  to authenticated
  with check (follower_id = (select auth.uid ()));

create policy "user_follows_delete_own"
  on public.user_follows for delete
  to authenticated
  using (follower_id = (select auth.uid ()));

grant select, insert, delete on public.user_follows to authenticated;
grant all on public.user_follows to service_role;

-- ---------------------------------------------------------------------------
-- user_can_see_message: team posts visible to all enrolled in challenge, or
-- follow feed for any challenge; official unchanged
-- ---------------------------------------------------------------------------
create or replace function public.user_can_see_message (p_message_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.challenge_messages m
    where m.id = p_message_id
      and (
        (
          m.is_official
          and exists (
            select 1
            from public.team_challenge_enrollments tce
            join public.team_members tm on tm.team_id = tce.team_id
            where tce.challenge_id = m.challenge_id
              and tce.completed_at is null
              and tm.user_id = p_user_id
          )
        )
        or (
          m.is_official = false
          and m.team_id is not null
          and exists (
            select 1
            from public.team_challenge_enrollments tce
            join public.team_members tm on tm.team_id = tce.team_id
            where tce.challenge_id = m.challenge_id
              and tce.completed_at is null
              and tm.user_id = p_user_id
          )
        )
        or (
          m.is_official = false
          and m.author_id is not null
          and exists (
            select 1
            from public.user_follows f
            where f.follower_id = p_user_id
              and f.following_id = m.author_id
          )
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- challenge_messages SELECT: match visibility
-- ---------------------------------------------------------------------------
drop policy if exists "challenge_messages_select" on public.challenge_messages;
create policy "challenge_messages_select" on public.challenge_messages
  for select
  to authenticated
  using (
    (
      is_official = true
      and exists (
        select 1
        from public.team_challenge_enrollments tce
        join public.team_members tm on tm.team_id = tce.team_id
        where tce.challenge_id = challenge_messages.challenge_id
          and tce.completed_at is null
          and tm.user_id = (select auth.uid ())
      )
    )
    or (
      is_official = false
      and team_id is not null
      and exists (
        select 1
        from public.team_challenge_enrollments tce
        join public.team_members tm on tm.team_id = tce.team_id
        where tce.challenge_id = challenge_messages.challenge_id
          and tce.completed_at is null
          and tm.user_id = (select auth.uid ())
      )
    )
    or (
      is_official = false
      and author_id is not null
      and exists (
        select 1
        from public.user_follows f
        where f.follower_id = (select auth.uid ())
          and f.following_id = author_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- challenge_participant_stats: ignore solo in member counts? optional — keep as-is
-- ---------------------------------------------------------------------------
