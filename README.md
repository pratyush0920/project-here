# Here

A private ambient-presence space for two people who are emotionally close and geographically apart.

**Feel close without starting a conversation.**

Here is not chat. There are no streaks, last-seen, read receipts, or location tracking. You share a little of today if you want to. The other person may react, or simply let it sit.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage, Realtime)
- Zod
- Vitest + Playwright

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in your Supabase values (see below), apply migrations, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SECRET_KEY=
```

`SUPABASE_SECRET_KEY` is **server-only**. It is required for account deletion. Never put it in the browser or prefix it with `NEXT_PUBLIC_`.

## Supabase setup

This repo cannot create your hosted project. Manual steps:

1. Create a Supabase project.
2. Copy the project URL and **publishable** key.
3. Copy the **secret** key for account deletion.
4. Run migrations:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Or paste `supabase/migrations/*.sql` into the SQL editor, in filename order.

5. Auth → URL configuration:
   - Site URL: `http://localhost:3000` (and your production domain later)
   - Redirect URLs: `/auth/callback` and `/auth/confirm` on each origin
6. Enable email OTP / magic links. Do not require passwords.
7. Confirm storage buckets `daily-photos`, `voice-drops`, and `avatars` are **private**.

Details: `docs/SUPABASE_SETUP.md`.

Generate database types once linked:

```bash
npx supabase gen types typescript --linked > types/database.generated.ts
```

Until then, `types/database.ts` matches the migrations.

## Testing

```bash
npm run typecheck
npm run lint
npm test
npx playwright install chromium   # first time
npm run test:e2e
```

Paired-user and RLS cases: `e2e/README.md` and `docs/SECURITY.md`.

## Deployment (Vercel)

1. Import the Git repository.
2. Set the environment variables for Production and Preview.
3. Set `NEXT_PUBLIC_APP_URL` to the production origin.
4. Add the production URLs to Supabase Auth redirects.
5. Apply migrations to the production Supabase project **before** using the app.

The app is not fully usable until Auth, Storage, and migrations are configured. The production **build** can still succeed without those secrets.

## Architecture

- `docs/PRODUCT.md` — product spec
- `docs/ARCHITECTURE.md` — engineering
- `docs/DATABASE.md` — schema and RLS
- `docs/FUTURE.md` — explicitly out of scope
- `AGENTS.md` — principles for later coding sessions
