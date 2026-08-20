# Here — project principles

This is **Here**: a private ambient-presence space for two people who are close but geographically apart.

## Product thesis

Help someone feel part of another person’s ordinary day **without conversational obligation**.

Moment → shared presence → optional acknowledgement.

Never: message → notification → reply expectation.

## Privacy is the product

Presence is **only** what a person chooses to share.

Never implement:

- location tracking or GPS
- online / last-seen / last-active
- read receipts (👀 is a deliberate reaction, not automatic)
- typing indicators
- reply latency or response-time metrics
- streaks, guilt copy, “you haven’t posted”, relationship scores
- activity monitoring or inferred availability
- public profiles, followers, discovery, groups

Do not infer that someone is online, awake, home, working, available, or ignoring someone.

Do not add analytics that log notes, photos, audio, emails, names, or moods.

## Engineering

- TypeScript **strict**. Do not use `any` to silence errors.
- Validate every important mutation **server-side**. Client checks are extra, not sufficient.
- Row Level Security is required on every private table. Frontend filtering is not security.
- Never expose service/admin keys. Never prefix secrets with `NEXT_PUBLIC_`.
- Use `@supabase/ssr` with `getAll` / `setAll` cookies. Do not use deprecated auth-helpers.
- Mobile-first UI, primary content ~480–600px. Warm, calm, not a dashboard.
- Avoid unnecessary dependencies. Next.js + Supabase is enough.
- No AI interpretation of feelings, closeness, or “what they really mean”.
- After meaningful changes: typecheck, lint, and run focused tests.

## Copy

Warm, understated, human. Never needy, never corporate, never surveillance-flavoured.

Prefer: “Nothing here yet.” / “Some days are quiet.” / “Leave a little of your day.”

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
