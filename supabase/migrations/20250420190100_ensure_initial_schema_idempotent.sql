-- Repair / idempotent: same as 20250420190000 but safe when the remote has
-- migration version drift and public.users (or other core objects) were never
-- actually created. Runs after 201900; no-ops on a healthy database.

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- challenges
-- ---------------------------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  title text not null,
  description text,
  duration_days int check (duration_days is null or duration_days > 0),
  created_at timestamptz not null default now ()
);

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
  )
  on conflict (id) do update
    set display_name = excluded.display_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.challenges enable row level security;

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
  on public.users for select
  to authenticated
  using (true);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  to authenticated
  using (id = (select auth.uid ()))
  with check (id = (select auth.uid ()));

drop policy if exists "challenges_select_authenticated" on public.challenges;
create policy "challenges_select_authenticated"
  on public.challenges for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on table public.users to authenticated;
grant select on table public.challenges to authenticated;
grant all on table public.users to service_role;
grant all on table public.challenges to service_role;
