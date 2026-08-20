# Security review notes

RLS and constraints in `supabase/migrations/` are the source of truth. These cases must remain true after any policy change.

| Attempt | Expected |
| --- | --- |
| User A `select` profiles of User C | 0 rows |
| User A `select` daily_entries of another connection | 0 rows |
| User A `update` partner daily_entry | fail |
| User A `delete` partner voice_drop | fail |
| User A insert reaction with someone else’s `sender_id` | fail |
| User A `accept_connection_invite` on own token | exception |
| Reuse accepted invite | exception |
| Accept expired/revoked invite | exception |
| Second active connection for the same user | trigger / unique / RPC exception |
| Storage read of another pair’s photo | denied |

Run after `supabase db push` with two (or three) authenticated SQL roles, or via the app using throwaway accounts.

Never log note text, photo URLs, or audio in analytics.
