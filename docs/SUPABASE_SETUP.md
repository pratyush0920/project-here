# Supabase manual setup

This repository cannot create your hosted project or apply migrations without your credentials.

## 1. Create a project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and the **publishable** (anon) key into `.env.local`.
3. Copy the **secret** key into `SUPABASE_SECRET_KEY` (server-only) if you want account deletion to work.

## 2. Auth

Authentication → Providers → Email:

- Enable email.
- Prefer **OTP** and/or magic links (passwordless). Passwords are not required for this MVP.
- Disable phone/SMS.

URL configuration:

- Site URL: `http://localhost:3000` locally, your production domain in production.
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `https://<your-domain>/auth/callback`
  - `https://<your-domain>/auth/confirm`

Email templates should point confirm links at `/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app/today`.

## 3. Apply migrations

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Or paste each file in `supabase/migrations/` into the SQL editor, in filename order.

Confirm buckets `daily-photos`, `voice-drops`, and `avatars` exist and are **not** public.

## 4. Realtime

Migrations add the tables to `supabase_realtime`. In the dashboard, ensure Realtime is enabled for those tables if your project requires an extra toggle.

## 5. Type generation

```bash
npx supabase gen types typescript --linked > types/database.generated.ts
```

## 6. Production

Set the same env vars in Vercel for Production and Preview. Use the production Site URL and redirect list. Configure custom SMTP before sending real invite email at volume.
