# Architecture

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase**: Postgres, Auth (email OTP / magic link), Storage (private), Realtime (table changes only — not Presence)
- **Zod** for shared validation
- Deployed on **Vercel**

## Layout

```
app/                 routes
actions/             server actions (validated mutations)
components/          UI by feature
lib/                 supabase clients, dates, validation, domain helpers
types/               Database typing + app models
supabase/migrations/ source of truth for schema, RLS, RPCs, storage
```

## Auth

Cookie sessions via `@supabase/ssr`.

- Browser: `lib/supabase/client.ts`
- Server: `lib/supabase/server.ts`
- Token refresh: `proxy.ts` + `lib/supabase/proxy.ts`
- Callback: `app/auth/callback/route.ts`
- Email OTP confirm: `app/auth/confirm/route.ts`

Protected routes are enforced in proxy **and** in server layouts. Identity checks use `getClaims()` / `getUser()`, never trusting `getSession()` alone on the server.

## Data flow

- Initial reads: Server Components where possible.
- Mutations: Server Actions with Zod + `auth.uid()` membership checks. Database constraints and RLS remain the last line of defence.
- Live updates: Realtime on `daily_entries`, `voice_drops`, `reactions` for the **active connection only**. If Realtime fails, refresh/fetch still works.
- Media: client compress/re-encode → private Storage upload → row insert. Signed URLs for display. No public buckets.

## Timezones

`lib/dates/timezone.ts` is the only place that computes “local calendar date”. Daily uniqueness is `(connection_id, user_id, local_date)` using the sender’s timezone, never the server UTC date.

## Secrets

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server |
| `NEXT_PUBLIC_APP_URL` | invite links |
| `SUPABASE_SECRET_KEY` | server only, account deletion |

Generate types when linked:

```bash
npx supabase gen types typescript --project-id <id> > types/database.generated.ts
```

Hand-maintained `types/database.ts` matches the migrations until that command is run.
