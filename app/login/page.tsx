import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { PublicHeader, SiteShell } from "@/components/layout/site-shell";
import { hasSupabaseConfig } from "@/lib/env";

export default function LoginPage() {
  return (
    <SiteShell>
      <PublicHeader />
      {!hasSupabaseConfig() ? (
        <p className="mt-6 rounded-2xl bg-surface-warm px-4 py-3 text-sm text-muted">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
          .env.local before codes will send.
        </p>
      ) : null}
      <Suspense>
        <LoginForm />
      </Suspense>
    </SiteShell>
  );
}
