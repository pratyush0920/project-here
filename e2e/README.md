# E2E with two real users

Playwright covers the public landing without Supabase.

The paired product path needs two inboxes (or Supabase Auth test OTP). Automate once you have:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- two test emails that can receive OTP

Then:

1. Sign in as User A → onboard → create invite
2. Sign in as User B → open `/invite/[token]` → join
3. User A shares a daily entry
4. User B sees it and reacts
5. User B leaves a voice drop
6. User A plays it
7. Memories for the current month contains the entry
8. User A disconnects → User B no longer sees A’s private content

Manual security checks (definition of done):

- User A cannot read User C’s profile
- cannot update a partner daily entry
- cannot delete a partner voice drop
- cannot react as another user
- cannot accept their own invite
- cannot reuse, accept expired, or accept revoked invites
- cannot create a second active connection
- cannot read private media from an unrelated connection
