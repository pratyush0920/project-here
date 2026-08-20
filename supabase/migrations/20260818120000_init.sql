-- Here MVP schema, RLS, RPCs, storage, realtime.
-- Apply in order via Supabase CLI or SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_path text,
  timezone text not null default 'UTC',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_len check (char_length(display_name) <= 50),
  constraint profiles_timezone_len check (char_length(timezone) between 1 and 64)
);

create index profiles_timezone_idx on public.profiles (timezone);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (new.id, '', 'UTC')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- connections
-- ---------------------------------------------------------------------------
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_one_id uuid not null references public.profiles (id),
  user_two_id uuid not null references public.profiles (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid references public.profiles (id),
  status text not null default 'active',
  constraint connections_two_people check (user_one_id <> user_two_id),
  constraint connections_ordered check (user_one_id < user_two_id),
  constraint connections_status_check check (status in ('active', 'ended')),
  constraint connections_ended_consistency check (
    (status = 'active' and ended_at is null and ended_by is null)
    or (status = 'ended' and ended_at is not null)
  )
);

create index connections_user_one_idx on public.connections (user_one_id);
create index connections_user_two_idx on public.connections (user_two_id);
create index connections_status_idx on public.connections (status);

create unique index connections_one_active_user_one
  on public.connections (user_one_id)
  where status = 'active';

create unique index connections_one_active_user_two
  on public.connections (user_two_id)
  where status = 'active';

create or replace function public.enforce_single_active_connection()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' then
    if exists (
      select 1
      from public.connections c
      where c.status = 'active'
        and c.id is distinct from new.id
        and (
          c.user_one_id in (new.user_one_id, new.user_two_id)
          or c.user_two_id in (new.user_one_id, new.user_two_id)
        )
    ) then
      raise exception 'A person can only have one active space';
    end if;
  end if;
  return new;
end;
$$;

create trigger connections_single_active
before insert or update on public.connections
for each row execute function public.enforce_single_active_connection();

-- ---------------------------------------------------------------------------
-- connection_invites
-- ---------------------------------------------------------------------------
create table public.connection_invites (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  token uuid unique not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id),
  revoked_at timestamptz
);

create index connection_invites_token_idx on public.connection_invites (token);
create index connection_invites_creator_idx on public.connection_invites (creator_id);
create index connection_invites_expires_idx on public.connection_invites (expires_at);

-- ---------------------------------------------------------------------------
-- daily_entries
-- ---------------------------------------------------------------------------
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  timezone_snapshot text not null,
  presence_status text,
  custom_status text,
  mood text,
  note text,
  photo_path text,
  song_url text,
  song_title text,
  song_artist text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_entries_unique_day unique (connection_id, user_id, local_date),
  constraint daily_entries_note_len check (note is null or char_length(note) <= 180),
  constraint daily_entries_custom_status_len check (custom_status is null or char_length(custom_status) <= 30),
  constraint daily_entries_presence_check check (
    presence_status is null
    or presence_status in (
      'working',
      'commuting',
      'home',
      'exploring',
      'need_company',
      'taking_it_slow',
      'offline',
      'custom'
    )
  ),
  constraint daily_entries_mood_check check (
    mood is null
    or mood in (
      'good',
      'calm',
      'excited',
      'tired',
      'overwhelmed',
      'low',
      'neutral'
    )
  ),
  constraint daily_entries_custom_presence check (
    (presence_status = 'custom' and custom_status is not null and char_length(btrim(custom_status)) > 0)
    or (presence_status is distinct from 'custom' and custom_status is null)
  ),
  constraint daily_entries_song_url_https check (
    song_url is null
    or song_url ~* '^https://'
  )
);

create index daily_entries_connection_date_idx
  on public.daily_entries (connection_id, local_date desc);
create index daily_entries_user_date_idx
  on public.daily_entries (user_id, local_date desc);
create index daily_entries_connection_user_idx
  on public.daily_entries (connection_id, user_id);

create trigger daily_entries_set_updated_at
before update on public.daily_entries
for each row execute function public.set_updated_at();

create or replace function public.enforce_daily_entry_membership()
returns trigger
language plpgsql
as $$
declare
  v_ok boolean;
begin
  select (
    (c.user_one_id = new.user_id or c.user_two_id = new.user_id)
    and c.status = 'active'
  )
  into v_ok
  from public.connections c
  where c.id = new.connection_id;

  if not coalesce(v_ok, false) then
    raise exception 'Daily entry must belong to an active connection member';
  end if;
  return new;
end;
$$;

create trigger daily_entries_membership
before insert or update on public.daily_entries
for each row execute function public.enforce_daily_entry_membership();

-- ---------------------------------------------------------------------------
-- voice_drops
-- ---------------------------------------------------------------------------
create table public.voice_drops (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  duration_seconds numeric not null,
  local_date date not null,
  timezone_snapshot text not null,
  created_at timestamptz not null default now(),
  constraint voice_drops_duration check (duration_seconds > 0 and duration_seconds <= 30),
  constraint voice_drops_mime_len check (char_length(mime_type) between 3 and 100)
);

create index voice_drops_connection_created_idx
  on public.voice_drops (connection_id, created_at desc);
create index voice_drops_sender_date_idx
  on public.voice_drops (sender_id, local_date desc);

create or replace function public.enforce_voice_drop_membership()
returns trigger
language plpgsql
as $$
declare
  v_ok boolean;
begin
  select (
    (c.user_one_id = new.sender_id or c.user_two_id = new.sender_id)
    and c.status = 'active'
  )
  into v_ok
  from public.connections c
  where c.id = new.connection_id;

  if not coalesce(v_ok, false) then
    raise exception 'Voice drop must belong to an active connection member';
  end if;
  return new;
end;
$$;

create trigger voice_drops_membership
before insert or update on public.voice_drops
for each row execute function public.enforce_voice_drop_membership();

-- ---------------------------------------------------------------------------
-- reactions
-- ---------------------------------------------------------------------------
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  daily_entry_id uuid references public.daily_entries (id) on delete cascade,
  voice_drop_id uuid references public.voice_drops (id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reactions_one_target check (
    (daily_entry_id is not null and voice_drop_id is null)
    or (daily_entry_id is null and voice_drop_id is not null)
  ),
  constraint reactions_type_check check (reaction in ('seen', 'laugh', 'here', 'heart'))
);

create unique index reactions_one_per_daily
  on public.reactions (sender_id, daily_entry_id)
  where daily_entry_id is not null;

create unique index reactions_one_per_voice
  on public.reactions (sender_id, voice_drop_id)
  where voice_drop_id is not null;

create index reactions_daily_idx on public.reactions (daily_entry_id);
create index reactions_voice_idx on public.reactions (voice_drop_id);
create index reactions_sender_idx on public.reactions (sender_id);

create trigger reactions_set_updated_at
before update on public.reactions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_active_connection_member(p_connection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections c
    where c.id = p_connection_id
      and c.status = 'active'
      and c.ended_at is null
      and (
        c.user_one_id = (select auth.uid())
        or c.user_two_id = (select auth.uid())
      )
  );
$$;

create or replace function public.active_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when c.user_one_id = (select auth.uid()) then c.user_two_id
    else c.user_one_id
  end
  from public.connections c
  where c.status = 'active'
    and (
      c.user_one_id = (select auth.uid())
      or c.user_two_id = (select auth.uid())
    )
  limit 1;
$$;

revoke all on function public.is_active_connection_member(uuid) from public;
revoke all on function public.active_partner_id() from public;
grant execute on function public.is_active_connection_member(uuid) to authenticated;
grant execute on function public.active_partner_id() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.connection_invites enable row level security;
alter table public.daily_entries enable row level security;
alter table public.voice_drops enable row level security;
alter table public.reactions enable row level security;

create policy profiles_select_self_or_partner
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or id = public.active_partner_id()
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy connections_select_member
on public.connections
for select
to authenticated
using (
  user_one_id = (select auth.uid())
  or user_two_id = (select auth.uid())
);

create policy invites_select_own
on public.connection_invites
for select
to authenticated
using (creator_id = (select auth.uid()));

create policy invites_insert_own
on public.connection_invites
for insert
to authenticated
with check (creator_id = (select auth.uid()));

create policy invites_update_own
on public.connection_invites
for update
to authenticated
using (creator_id = (select auth.uid()))
with check (creator_id = (select auth.uid()));

create policy daily_entries_select_active_members
on public.daily_entries
for select
to authenticated
using (public.is_active_connection_member(connection_id));

create policy daily_entries_insert_own_active
on public.daily_entries
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_active_connection_member(connection_id)
);

create policy daily_entries_update_own
on public.daily_entries
for update
to authenticated
using (
  user_id = (select auth.uid())
  and public.is_active_connection_member(connection_id)
)
with check (
  user_id = (select auth.uid())
  and public.is_active_connection_member(connection_id)
);

create policy daily_entries_delete_own
on public.daily_entries
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and public.is_active_connection_member(connection_id)
);

create policy voice_drops_select_active_members
on public.voice_drops
for select
to authenticated
using (public.is_active_connection_member(connection_id));

create policy voice_drops_insert_own_active
on public.voice_drops
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_active_connection_member(connection_id)
);

create policy voice_drops_delete_own
on public.voice_drops
for delete
to authenticated
using (
  sender_id = (select auth.uid())
  and public.is_active_connection_member(connection_id)
);

create policy reactions_select_via_targets
on public.reactions
for select
to authenticated
using (
  (
    daily_entry_id is not null
    and exists (
      select 1
      from public.daily_entries d
      where d.id = daily_entry_id
        and public.is_active_connection_member(d.connection_id)
    )
  )
  or (
    voice_drop_id is not null
    and exists (
      select 1
      from public.voice_drops v
      where v.id = voice_drop_id
        and public.is_active_connection_member(v.connection_id)
    )
  )
);

create policy reactions_insert_own
on public.reactions
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and (
    (
      daily_entry_id is not null
      and exists (
        select 1
        from public.daily_entries d
        where d.id = daily_entry_id
          and public.is_active_connection_member(d.connection_id)
      )
    )
    or (
      voice_drop_id is not null
      and exists (
        select 1
        from public.voice_drops v
        where v.id = voice_drop_id
          and public.is_active_connection_member(v.connection_id)
      )
    )
  )
);

create policy reactions_update_own
on public.reactions
for update
to authenticated
using (sender_id = (select auth.uid()))
with check (sender_id = (select auth.uid()));

create policy reactions_delete_own
on public.reactions
for delete
to authenticated
using (sender_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.create_connection_invite()
returns table (
  id uuid,
  token uuid,
  expires_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.connection_invites;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1
    from public.connections c
    where c.status = 'active'
      and (c.user_one_id = v_user or c.user_two_id = v_user)
  ) then
    raise exception 'You already have an active space';
  end if;

  update public.connection_invites
  set revoked_at = now()
  where creator_id = v_user
    and accepted_at is null
    and revoked_at is null;

  insert into public.connection_invites (creator_id, expires_at)
  values (v_user, now() + interval '7 days')
  returning * into v_invite;

  id := v_invite.id;
  token := v_invite.token;
  expires_at := v_invite.expires_at;
  return next;
end;
$$;

create or replace function public.accept_connection_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.connection_invites;
  v_one uuid;
  v_two uuid;
  v_connection_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_invite
  from public.connection_invites
  where token = invite_token
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'Invite is no longer valid';
  end if;

  if v_invite.accepted_at is not null then
    raise exception 'Invite already used';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'Invite expired';
  end if;

  if v_invite.creator_id = v_user then
    raise exception 'You cannot accept your own invite';
  end if;

  perform 1
  from public.connections c
  where c.status = 'active'
    and (
      c.user_one_id in (v_invite.creator_id, v_user)
      or c.user_two_id in (v_invite.creator_id, v_user)
    )
  for update;

  if exists (
    select 1
    from public.connections c
    where c.status = 'active'
      and (
        c.user_one_id in (v_invite.creator_id, v_user)
        or c.user_two_id in (v_invite.creator_id, v_user)
      )
  ) then
    raise exception 'One of you already has an active space';
  end if;

  if v_invite.creator_id < v_user then
    v_one := v_invite.creator_id;
    v_two := v_user;
  else
    v_one := v_user;
    v_two := v_invite.creator_id;
  end if;

  insert into public.connections (user_one_id, user_two_id, created_by, status)
  values (v_one, v_two, v_invite.creator_id, 'active')
  returning id into v_connection_id;

  update public.connection_invites
  set accepted_at = now(),
      accepted_by = v_user
  where id = v_invite.id;

  return v_connection_id;
end;
$$;

create or replace function public.end_connection(p_connection_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.connections;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_row
  from public.connections
  where id = p_connection_id
  for update;

  if not found then
    raise exception 'Space not found';
  end if;

  if v_row.user_one_id <> v_user and v_row.user_two_id <> v_user then
    raise exception 'Not a member of this space';
  end if;

  if v_row.status <> 'active' then
    return;
  end if;

  update public.connections
  set status = 'ended',
      ended_at = now(),
      ended_by = v_user
  where id = p_connection_id;
end;
$$;

create or replace function public.get_invite_preview(invite_token uuid)
returns table (
  display_name text,
  avatar_path text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_invite public.connection_invites;
begin
  select *
  into v_invite
  from public.connection_invites
  where token = invite_token;

  if not found
     or v_invite.revoked_at is not null
     or v_invite.accepted_at is not null
     or v_invite.expires_at <= now() then
    return;
  end if;

  return query
  select p.display_name, p.avatar_path, v_invite.expires_at
  from public.profiles p
  where p.id = v_invite.creator_id;
end;
$$;

create or replace function public.revoke_connection_invite(p_invite_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.connection_invites
  set revoked_at = now()
  where id = p_invite_id
    and creator_id = auth.uid()
    and accepted_at is null
    and revoked_at is null;
end;
$$;

revoke all on function public.create_connection_invite() from public;
revoke all on function public.accept_connection_invite(uuid) from public;
revoke all on function public.end_connection(uuid) from public;
revoke all on function public.get_invite_preview(uuid) from public;
revoke all on function public.revoke_connection_invite(uuid) from public;

grant execute on function public.create_connection_invite() to authenticated;
grant execute on function public.accept_connection_invite(uuid) to authenticated;
grant execute on function public.end_connection(uuid) to authenticated;
grant execute on function public.get_invite_preview(uuid) to authenticated;
grant execute on function public.revoke_connection_invite(uuid) to authenticated;
grant execute on function public.get_invite_preview(uuid) to anon;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.daily_entries replica identity full;
alter table public.voice_drops replica identity full;
alter table public.reactions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'daily_entries'
  ) then
    execute 'alter publication supabase_realtime add table public.daily_entries';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'voice_drops'
  ) then
    execute 'alter publication supabase_realtime add table public.voice_drops';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reactions'
  ) then
    execute 'alter publication supabase_realtime add table public.reactions';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'connections'
  ) then
    execute 'alter publication supabase_realtime add table public.connections';
  end if;
exception
  when undefined_object then
    null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'daily-photos',
    'daily-photos',
    false,
    5242880,
    array['image/webp', 'image/jpeg', 'image/png']
  ),
  (
    'voice-drops',
    'voice-drops',
    false,
    6291456,
    array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4;codecs=opus', 'audio/webm;codecs=opus']
  ),
  (
    'avatars',
    'avatars',
    false,
    2097152,
    array['image/webp', 'image/jpeg', 'image/png']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy daily_photos_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'daily-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_active_connection_member(((storage.foldername(name))[1])::uuid)
);

create policy daily_photos_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'daily-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
  bucket_id = 'daily-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy daily_photos_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'daily-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy daily_photos_select_members
on storage.objects
for select
to authenticated
using (
  bucket_id = 'daily-photos'
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or public.is_active_connection_member(((storage.foldername(name))[1])::uuid)
  )
);

create policy voice_drops_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'voice-drops'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_active_connection_member(((storage.foldername(name))[1])::uuid)
);

create policy voice_drops_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'voice-drops'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy voice_drops_select_members
on storage.objects
for select
to authenticated
using (
  bucket_id = 'voice-drops'
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or public.is_active_connection_member(((storage.foldername(name))[1])::uuid)
  )
);

create policy avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_select_self_or_partner
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (storage.foldername(name))[1] = (public.active_partner_id())::text
  )
);
