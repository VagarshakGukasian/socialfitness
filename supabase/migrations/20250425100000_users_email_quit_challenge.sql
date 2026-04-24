-- public.users.email (для отображения в UI) + выход команды из челленджа.

alter table public.users add column if not exists email text;

update public.users u
set email = au.email
from auth.users au
where u.id = au.id;

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
  return new;
end;
$$;

-- Удаление участия команды + сообщений команды (не официальных)
create or replace function public.quit_team_challenge (p_team_id uuid, p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_member (p_team_id, (select auth.uid ())) then
    raise exception 'not a team member';
  end if;
  if not exists (
    select 1
    from public.team_challenge_enrollments tce
    where tce.team_id = p_team_id
      and tce.challenge_id = p_challenge_id
  ) then
    raise exception 'not enrolled';
  end if;

  delete from public.challenge_messages
  where challenge_id = p_challenge_id
    and team_id = p_team_id
    and is_official = false;

  delete from public.team_challenge_enrollments
  where team_id = p_team_id
    and challenge_id = p_challenge_id;
end;
$$;

grant execute on function public.quit_team_challenge (uuid, uuid) to authenticated;
