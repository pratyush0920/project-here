# Database

Migrations live in `supabase/migrations/`. Apply them in the Supabase SQL editor or with the CLI. They have **not** been applied to a hosted project from this repository unless you ran them.

## Tables

- **profiles** — `id` = `auth.users.id`. Shell row created on signup. Display name + timezone completed in onboarding.
- **connection_invites** — unguessable UUID token, 7-day expiry, single use, revocable.
- **connections** — two members, `status` `active` | `ended`. Trigger + RPC prevent more than one active connection per user.
- **daily_entries** — unique per `(connection_id, user_id, local_date)`. Note ≤ 180, custom status ≤ 30, mood/presence CHECKs.
- **voice_drops** — duration `(0, 30]`, MIME + path + local_date snapshot.
- **reactions** — exactly one of `daily_entry_id` / `voice_drop_id`. Partial unique indexes: one reaction per sender per target.

## RPCs

| Function | Role |
| --- | --- |
| `create_connection_invite()` | Authenticated, no active connection; revokes unused own invites; returns token + expiry. |
| `accept_connection_invite(token)` | SECURITY DEFINER, row locks, atomic accept + connection insert. |
| `end_connection(connection_id)` | Member-only; marks ended. |
| `get_invite_preview(token)` | Minimal public preview (name/avatar) for a **valid pending** invite. |
| `delete_own_account()` | Marks user for deletion path used with the admin API from the Next.js server. |

## RLS summary

Every table has RLS enabled.

- **profiles**: self read/update; partner read only while an **active** connection exists.
- **connection_invites**: creator read/update (revoke). No enumeration. Accept via RPC.
- **connections**: members can SELECT. No client INSERT.
- **daily_entries / voice_drops**: members of an **active** connection can SELECT. Authors insert/update/delete only their rows, and only while the connection is active (insert). After disconnect, partner content is not readable.
- **reactions**: members can read; sender mutates own rows only.

Helper `is_active_connection_member(id)` is `SECURITY DEFINER` + `stable` with `(select auth.uid())` so policies stay index-friendly.

## Storage

Private buckets: `daily-photos`, `voice-drops`, `avatars`.

Paths:

- photos: `{connection_id}/{user_id}/{uuid}.webp`
- voice: `{connection_id}/{user_id}/{uuid}.{ext}`
- avatars: `{user_id}/{uuid}.webp`

Upload/delete only into own user segment. Read if owner **or** active connection member matching the connection folder.

## Indexes

FKs, `local_date`, `(connection_id, created_at)`, invite `token`, and fields used by RLS membership checks.
