import { AcceptInvite } from "@/components/onboarding/accept-invite";
import { PublicHeader, SiteShell } from "@/components/layout/site-shell";
import { createClient } from "@/lib/supabase/server";
import { inviteTokenSchema } from "@/lib/validation/schemas";
import { signedUrl } from "@/lib/data/space";

export const dynamic = "force-dynamic";

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const parsed = inviteTokenSchema.safeParse(token);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!parsed.success) {
    return (
      <SiteShell>
        <PublicHeader />
        <p className="mt-10 text-muted">That invite link doesn&apos;t look right.</p>
      </SiteShell>
    );
  }

  const { data } = await supabase.rpc("get_invite_preview", {
    invite_token: parsed.data,
  });
  const preview = Array.isArray(data) ? data[0] : data;

  if (!preview) {
    return (
      <SiteShell>
        <PublicHeader />
        <h1 className="mt-10 text-2xl font-medium">This invite isn&apos;t available.</h1>
        <p className="mt-3 text-muted">
          It may have expired, already been used, or been revoked.
        </p>
      </SiteShell>
    );
  }

  const avatarUrl = await signedUrl("avatars", preview.avatar_path);
  const name = preview.display_name.trim() || "Someone";

  return (
    <SiteShell>
      <PublicHeader />
      <AcceptInvite
        token={parsed.data}
        name={name}
        avatarUrl={avatarUrl}
        signedIn={Boolean(user)}
      />
    </SiteShell>
  );
}
