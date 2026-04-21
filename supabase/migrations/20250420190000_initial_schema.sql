-- Minimal schema: public.users + public.challenges
-- Auth: Supabase auth.users is the source of truth; public.users holds app profile fields.

-- ---------------------------------------------------------------------------
-- users (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

comment on table public.users is 'App profile linked to auth.users.';

-- ---------------------------------------------------------------------------
-- challenges
-- ---------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  title text not null,
  description text,
  duration_days int check (duration_days is null or duration_days > 0),
  created_at timestamptz not null default now ()
);

comment on table public.challenges is 'Fitness challenges (e.g. 30-day programs).';

-- ---------------------------------------------------------------------------
-- New auth user -> public.users row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.challenges enable row level security;

create policy "users_select_authenticated"
  on public.users for select
  to authenticated
  using (true);

create policy "users_update_own"
  on public.users for update
  to authenticated
  using (id = (select auth.uid ()))
  with check (id = (select auth.uid ()));

create policy "challenges_select_authenticated"
  on public.challenges for select
  to authenticated
  using (true);

-- Inserts/updates to challenges are done with service role or SQL editor unless you add policies.
-- To allow logged-in admins only, add a role or use the dashboard.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on table public.users to authenticated;
grant select on table public.challenges to authenticated;

grant all on table public.users to service_role;
grant all on table public.challenges to service_role;
