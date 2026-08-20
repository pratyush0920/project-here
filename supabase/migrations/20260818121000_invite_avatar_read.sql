-- Allow invitees with a valid pending invite to see the inviter's avatar.
create policy avatars_select_pending_invite
on storage.objects
for select
to authenticated, anon
using (
  bucket_id = 'avatars'
  and exists (
    select 1
    from public.connection_invites i
    where i.creator_id::text = (storage.foldername(name))[1]
      and i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > now()
  )
);
