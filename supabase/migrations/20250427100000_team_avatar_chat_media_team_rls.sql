-- Team avatars, chat message attachments, storage buckets, team_members RLS (creator manages roster).

-- ---------------------------------------------------------------------------
-- teams.avatar_url (public URL or site-relative path e.g. /team-pics/...)
-- ---------------------------------------------------------------------------
alter table public.teams
  add column if not exists avatar_url text;

update public.teams
set
  avatar_url = '/team-pics/team_pic_' || ((abs(hashtext(id::text)) % 5) + 1) || '.jpg'
where
  avatar_url is null
  and coalesce(is_solo, false) = false;

update public.teams
set avatar_url = null
where is_solo = true;

-- ---------------------------------------------------------------------------
-- Chat attachments (up to 3 per message; enforced in app)
-- ---------------------------------------------------------------------------
create table if not exists public.challenge_message_attachments (
  id uuid primary key default gen_random_uuid (),
  message_id uuid not null references public.challenge_messages (id) on delete cascade,
  media_url text not null,
  sort_order int not null default 0,
  mime_type text,
  created_at timestamptz not null default now ()
);

create index if not exists challenge_message_attachments_message_idx
  on public.challenge_message_attachments (message_id, sort_order);

alter table public.challenge_message_attachments enable row level security;

create policy "challenge_message_attachments_select"
  on public.challenge_message_attachments for select
  to authenticated
  using (
    public.user_can_see_message (message_id, (select auth.uid ()))
  );

create policy "challenge_message_attachments_insert_author"
  on public.challenge_message_attachments for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.challenge_messages m
      where
        m.id = message_id
        and m.author_id = (select auth.uid ())
        and m.is_official = false
    )
  );

create policy "challenge_message_attachments_delete_author"
  on public.challenge_message_attachments for delete
  to authenticated
  using (
    exists (
      select 1
      from public.challenge_messages m
      where
        m.id = message_id
        and m.author_id = (select auth.uid ())
    )
  );

grant select, insert, delete on public.challenge_message_attachments to authenticated;
grant all on public.challenge_message_attachments to service_role;

-- ---------------------------------------------------------------------------
-- Storage: team avatars + chat media (authenticated read; path rules on upload)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-avatars',
  'team-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  true,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "team_avatars_public_read" on storage.objects;
create policy "team_avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'team-avatars');

drop policy if exists "team_avatars_insert_own_folder" on storage.objects;
create policy "team_avatars_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'team-avatars'
    and (split_part(name, '/', 1)) = (select auth.uid ())::text
  );

drop policy if exists "team_avatars_update_own_folder" on storage.objects;
create policy "team_avatars_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'team-avatars'
    and (split_part(name, '/', 1)) = (select auth.uid ())::text
  );

drop policy if exists "team_avatars_delete_own_folder" on storage.objects;
create policy "team_avatars_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'team-avatars'
    and (split_part(name, '/', 1)) = (select auth.uid ())::text
  );

drop policy if exists "chat_media_public_read" on storage.objects;
create policy "chat_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-media');

drop policy if exists "chat_media_insert_own_folder" on storage.objects;
create policy "chat_media_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-media'
    and (split_part(name, '/', 1)) = (select auth.uid ())::text
  );

drop policy if exists "chat_media_delete_own_folder" on storage.objects;
create policy "chat_media_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-media'
    and (split_part(name, '/', 1)) = (select auth.uid ())::text
  );

-- ---------------------------------------------------------------------------
-- team_members: only team creator may add people (non-solo); leave / creator removes
-- ---------------------------------------------------------------------------
drop policy if exists "team_members_insert_if_member" on public.team_members;

create policy "team_members_insert_creator"
  on public.team_members for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.teams t
      where
        t.id = team_id
        and t.created_by = (select auth.uid ())
        and coalesce(t.is_solo, false) = false
    )
  );

drop policy if exists "team_members_delete_self_or_teammate" on public.team_members;

create policy "team_members_delete_leave_or_creator"
  on public.team_members for delete
  to authenticated
  using (
    user_id = (select auth.uid ())
    or exists (
      select 1
      from public.teams t
      where
        t.id = team_members.team_id
        and t.created_by = (select auth.uid ())
        and coalesce(t.is_solo, false) = false
    )
  );
