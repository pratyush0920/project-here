"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, TextInput } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { emailSchema } from "@/lib/validation/schemas";
import { safeNextPath } from "@/lib/env";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
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

  return (
    <div className="mt-10">
      <h1 className="text-2xl font-medium">Continue with email</h1>
      <p className="mt-2 text-sm text-muted">
        We&apos;ll send a short code. No password, no public profile.
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
                  shouldCreateUser: true,
                },
              });
              if (error) {
                setMessage("Couldn't send that just now. Try once more.");
                return;
              }
              setSent(true);
              setMessage("Check your email for a code, or tap the link.");
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
          {sent ? "Sign in" : "Email me a code"}
        </Button>
      </form>
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
