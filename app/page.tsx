import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Home, Coffee } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between py-2">
        <Wordmark href="/" />
        <nav aria-label="Account" className="flex items-center gap-4 text-sm">
          <Link href="/login?mode=signup" className="text-muted">
            Sign up
          </Link>
          <Link href="/login" className="text-muted">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mt-10">
        <p className="text-sm text-muted">here.</p>
        <h1 className="mt-3 text-[2rem] font-medium leading-tight tracking-tight">
          Feel close without starting a conversation.
        </h1>
        <p className="mt-4 max-w-md text-muted">
          A private space for two people to share the little parts of their day.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login?mode=signup&next=/onboarding"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-strong px-5 text-[15px] font-medium text-white"
          >
            Create your space
          </Link>
          <Link
            href="/invite"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-surface-warm px-5 text-[15px] font-medium"
          >
            I have an invite
          </Link>
        </div>

        <div className="mt-12 grid gap-4">
          <article className="rounded-[28px] border border-border bg-surface p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 font-medium">
                <Home className="h-4 w-4 text-accent" aria-hidden />
                Home
              </span>
              <span className="text-muted">8:42 PM</span>
            </div>
            <p className="mt-4 text-sm text-muted">feeling calm</p>
            <p className="mt-2 text-[17px]">Finally got chai.</p>
          </article>
          <article className="rounded-[28px] border border-border bg-surface p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 font-medium">
                <Coffee className="h-4 w-4 text-accent" aria-hidden />
                Working
              </span>
              <span className="text-muted">11:05 AM</span>
            </div>
            <p className="mt-4 text-sm text-muted">feeling tired</p>
            <p className="mt-2 text-[17px]">PM interview prep is killing me today.</p>
          </article>
        </div>

        <ul className="mt-14 space-y-8">
          <li>
            <h2 className="font-medium">Share the ordinary.</h2>
            <p className="mt-1 text-sm text-muted">
              A thought, photo, song or tiny piece of your day.
            </p>
          </li>
          <li>
            <h2 className="font-medium">No reply required.</h2>
            <p className="mt-1 text-sm text-muted">
              See it, react if you want, move on with your day.
            </p>
          </li>
          <li>
            <h2 className="font-medium">Keep the little moments.</h2>
            <p className="mt-1 text-sm text-muted">
              Your days quietly collect into shared memories.
            </p>
          </li>
        </ul>

        <p className="mt-14 text-sm text-muted">
          Private by design. No followers. No public profiles.
        </p>
      </main>
    </div>
  );
}
