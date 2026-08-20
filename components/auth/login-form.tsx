"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, TextInput } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { emailSchema } from "@/lib/validation/schemas";
import { safeNextPath } from "@/lib/env";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isSignUp = params.get("mode") === "signup";
  const requestedNext = params.get("next");
  const next = safeNextPath(
    requestedNext,
    isSignUp ? "/onboarding" : "/app/today",
  );
  const invite = params.get("invite");
  const errorCode = params.get("error");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(
    errorCode === "expired"
      ? "That sign-in link is no longer valid. Ask for a new one."
      : errorCode === "auth"
        ? "Couldn't finish signing in. Try once more."
        : null,
  );
  const [pending, startTransition] = useTransition();

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
    invite ? `/invite/${invite}` : next,
  )}`;
  const alternateParams = new URLSearchParams();
  if (!isSignUp) alternateParams.set("mode", "signup");
  if (requestedNext) alternateParams.set("next", requestedNext);
  if (invite) alternateParams.set("invite", invite);
  const alternateQuery = alternateParams.toString();
  const alternateHref = `/login${alternateQuery ? `?${alternateQuery}` : ""}`;

  return (
    <div className="mt-10">
      <h1 className="text-2xl font-medium">
        {isSignUp ? "Sign up with email" : "Continue with email"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignUp
          ? "Create your private account with a short email code."
          : "We'll send a short code. No password, no public profile."}
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const parsed = emailSchema.safeParse(email);
            if (!parsed.success) {
              setMessage("Use a valid email address.");
              return;
            }
            const supabase = createClient();
            if (!sent) {
              const { error } = await supabase.auth.signInWithOtp({
                email: parsed.data,
                options: {
                  emailRedirectTo: redirectTo,
                  shouldCreateUser: isSignUp,
                },
              });
              if (error) {
                setMessage(
                  isSignUp
                    ? "Couldn't start sign-up just now. Try once more."
                    : "Couldn't send a sign-in code. If you're new, choose Sign up.",
                );
                return;
              }
              setSent(true);
              setMessage(
                isSignUp
                  ? "Check your email to finish signing up."
                  : "Check your email for a code, or tap the link.",
              );
              return;
            }
            const { error } = await supabase.auth.verifyOtp({
              email: parsed.data,
              token: code.trim(),
              type: "email",
            });
            if (error) {
              setMessage("That code didn't work. Try the newest one.");
              return;
            }
            router.replace(invite ? `/invite/${invite}` : next);
            router.refresh();
          });
        }}
      >
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        {sent ? (
          <Field label="Code from email" hint="Usually six digits.">
            <TextInput
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </Field>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {sent
            ? isSignUp
              ? "Finish sign up"
              : "Sign in"
            : isSignUp
              ? "Email me a sign-up code"
              : "Email me a sign-in code"}
        </Button>
      </form>
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      <p className="mt-8 text-center text-sm text-muted">
        {isSignUp ? "Already have an account?" : "New to Here?"}{" "}
        <Link
          href={alternateHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setSent(false);
            setCode("");
            setMessage(null);
          }}
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}
