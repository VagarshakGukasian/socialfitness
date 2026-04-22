-- Teams, challenge enrollments, chat messages, reactions; extend challenges.

-- ---------------------------------------------------------------------------
-- challenges: image + periodicity
-- ---------------------------------------------------------------------------
alter table public.challenges
  add column if not exists image_url text,
  add column if not exists interval_days int not null default 1;

alter table public.challenges
  drop constraint if exists challenges_interval_days_check;

alter table public.challenges
  add constraint challenges_interval_days_check check (interval_days > 0);

comment on column public.challenges.interval_days is 'Official challenge posts every N days.';

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now ()
);

create index teams_created_by_idx on public.teams (created_by);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now (),
  primary key (team_id, user_id)
);

create index team_members_user_id_idx on public.team_members (user_id);

-- ---------------------------------------------------------------------------
-- team <-> challenge
-- ---------------------------------------------------------------------------
create table public.team_challenge_enrollments (
  id uuid primary key default gen_random_uuid (),
  team_id uuid not null references public.teams (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  enrolled_at timestamptz not null default now (),
  completed_at timestamptz,
  unique (team_id, challenge_id)
);

create index team_challenge_enrollments_challenge_id_idx
  on public.team_challenge_enrollments (challenge_id);

-- ---------------------------------------------------------------------------
-- chat: official posts (is_official) + team member posts
-- ---------------------------------------------------------------------------
create table public.challenge_messages (
  id uuid primary key default gen_random_uuid (),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  team_id uuid references public.teams (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  is_official boolean not null default false,
  body text not null,
  created_at timestamptz not null default now (),
  constraint challenge_messages_shape check (
    (
      is_official = true
      and team_id is null
      and author_id is null
    )
    or (
      is_official = false
      and team_id is not null
      and author_id is not null
    )
  )
);

create index challenge_messages_challenge_team_idx
  on public.challenge_messages (challenge_id, team_id);

-- ---------------------------------------------------------------------------
-- Slack-style reactions
-- ---------------------------------------------------------------------------
create table public.message_reactions (
  id uuid primary key default gen_random_uuid (),
  message_id uuid not null references public.challenge_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now (),
  unique (message_id, user_id, emoji)
);

create index message_reactions_message_id_idx on public.message_reactions (message_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_team_member (p_team_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = p_user_id
  );
$$;

grant execute on function public.is_team_member (uuid, uuid) to authenticated;

create or replace function public.team_enrolled_in_challenge (p_team_id uuid, p_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_challenge_enrollments tce
    where tce.team_id = p_team_id
      and tce.challenge_id = p_challenge_id
      and tce.completed_at is null
  );
$$;

grant execute on function public.team_enrolled_in_challenge (uuid, uuid) to authenticated;

create or replace function public.user_can_access_team_challenge_chat (
  p_user_id uuid,
  p_challenge_id uuid,
  p_team_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_team_member (p_team_id, p_user_id)
    and public.team_enrolled_in_challenge (p_team_id, p_challenge_id);
$$;

grant execute on function public.user_can_access_team_challenge_chat (uuid, uuid, uuid) to authenticated;

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
              and tm.user_id = p_user_id
              and tce.completed_at is null
          )
        )
        or (
          not m.is_official
          and m.team_id is not null
          and public.user_can_access_team_challenge_chat (
            p_user_id,
            m.challenge_id,
            m.team_id
          )
        )
      )
  );
$$;

grant execute on function public.user_can_see_message (uuid, uuid) to authenticated;

create or replace function public.challenge_participant_stats (p_challenge_id uuid)
returns table (active_users bigint, completed_users bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(
      (
        select count(distinct tm.user_id)::bigint
        from public.team_challenge_enrollments tce
        join public.team_members tm on tm.team_id = tce.team_id
        where tce.challenge_id = p_challenge_id
          and tce.completed_at is null
      ),
      0::bigint
    ) as active_users,
    coalesce(
      (
        select count(distinct tm.user_id)::bigint
        from public.team_challenge_enrollments tce
        join public.team_members tm on tm.team_id = tce.team_id
        where tce.challenge_id = p_challenge_id
          and tce.completed_at is not null
      ),
      0::bigint
    ) as completed_users;
$$;

grant execute on function public.challenge_participant_stats (uuid) to authenticated;

-- Creator becomes member
create or replace function public.add_team_creator_as_member ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$;

create trigger teams_after_insert_add_creator
  after insert on public.teams
  for each row
  execute function public.add_team_creator_as_member ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_challenge_enrollments enable row level security;
alter table public.challenge_messages enable row level security;
alter table public.message_reactions enable row level security;

-- teams: any auth can read; create if authenticated; update only creator
create policy "teams_select_authenticated"
  on public.teams for select
  to authenticated
  using (true);

create policy "teams_insert_authenticated"
  on public.teams for insert
  to authenticated
  with check (created_by = (select auth.uid ()));

create policy "teams_update_creator"
  on public.teams for update
  to authenticated
  using (created_by = (select auth.uid ()))
  with check (created_by = (select auth.uid ()));

-- team_members: read all; insert if already member (invite) or self? only members add others
create policy "team_members_select_authenticated"
  on public.team_members for select
  to authenticated
  using (true);

create policy "team_members_insert_if_member"
  on public.team_members for insert
  to authenticated
  with check (public.is_team_member (team_id, (select auth.uid ())));

create policy "team_members_delete_self_or_teammate"
  on public.team_members for delete
  to authenticated
  using (
    user_id = (select auth.uid ())
    or public.is_team_member (team_id, (select auth.uid ()))
  );

-- enrollments: read if member of team; insert if member of team
create policy "tce_select_visible"
  on public.team_challenge_enrollments for select
  to authenticated
  using (public.is_team_member (team_id, (select auth.uid ())));

create policy "tce_insert_if_team_member"
  on public.team_challenge_enrollments for insert
  to authenticated
  with check (public.is_team_member (team_id, (select auth.uid ())));

create policy "tce_update_if_team_member"
  on public.team_challenge_enrollments for update
  to authenticated
  using (public.is_team_member (team_id, (select auth.uid ())));

-- messages: read official + team room for enrolled team
create policy "challenge_messages_select"
  on public.challenge_messages for select
  to authenticated
  using (
    (
      is_official = true
      and exists (
        select 1
        from public.team_challenge_enrollments tce
        join public.team_members tm on tm.team_id = tce.team_id
        where tce.challenge_id = challenge_messages.challenge_id
          and tm.user_id = (select auth.uid ())
          and tce.completed_at is null
      )
    )
    or (
      is_official = false
      and public.user_can_access_team_challenge_chat (
        (select auth.uid ()),
        challenge_id,
        team_id
      )
    )
  );

-- member posts only
create policy "challenge_messages_insert_member"
  on public.challenge_messages for insert
  to authenticated
  with check (
    is_official = false
    and author_id = (select auth.uid ())
    and public.user_can_access_team_challenge_chat (
      (select auth.uid ()),
      challenge_id,
      team_id
    )
  );

-- reactions: visible if you can see message; add/remove own
create policy "message_reactions_select"
  on public.message_reactions for select
  to authenticated
  using (
    public.user_can_see_message (message_id, (select auth.uid ()))
  );

create policy "message_reactions_insert"
  on public.message_reactions for insert
  to authenticated
  with check (
    user_id = (select auth.uid ())
    and public.user_can_see_message (message_id, (select auth.uid ()))
  );

create policy "message_reactions_delete_own"
  on public.message_reactions for delete
  to authenticated
  using (user_id = (select auth.uid ()));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table public.teams to authenticated;
grant select, insert, delete on table public.team_members to authenticated;
grant select, insert, update on table public.team_challenge_enrollments to authenticated;
grant select, insert on table public.challenge_messages to authenticated;
grant select, insert, delete on table public.message_reactions to authenticated;

grant all on table public.teams to service_role;
grant all on table public.team_members to service_role;
grant all on table public.team_challenge_enrollments to service_role;
grant all on table public.challenge_messages to service_role;
grant all on table public.message_reactions to service_role;

-- Service role / migration can insert official messages (bypass RLS)

-- ---------------------------------------------------------------------------
-- Seed: «30 дней пресса» + официальные посты (однократно)
-- ---------------------------------------------------------------------------
insert into public.challenges (slug, title, description, duration_days, image_url, interval_days)
values (
  '30-dney-pressa',
  '30 дней пресса',
  'Тридцать дней коротких тренировок на пресс: планка, скручивания, велосипед.',
  30,
  '/challenges/30-day-abs-cover.svg',
  1
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  duration_days = excluded.duration_days,
  image_url = excluded.image_url,
  interval_days = excluded.interval_days;

insert into public.challenge_messages (challenge_id, is_official, body, created_at)
select
  c.id,
  true,
  'День ' || d || E': 3 круга — планка на локтях 30 сек, скручивания 12 раз, «велосипед» 20 раз. Между кругами отдых 45 сек.',
  (timestamptz '2025-01-01 08:00:00+00' + (d - 1) * interval '1 day')
from public.challenges c
cross join generate_series(1, 30) as d
where c.slug = '30-dney-pressa'
  and not exists (
    select 1
    from public.challenge_messages m
    where m.challenge_id = c.id
      and m.is_official = true
  );
