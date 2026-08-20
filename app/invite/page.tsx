import { InviteCreate } from "@/components/onboarding/invite-create";
import { PublicHeader, SiteShell } from "@/components/layout/site-shell";
import { getUserAndProfile } from "@/lib/data/space";
import { profileComplete } from "@/lib/connections/helpers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const { user, profile, supabase } = await getUserAndProfile();
  if (!user) redirect("/login?next=/invite");
  if (!profileComplete(profile)) redirect("/onboarding");

  const { data: active } = await supabase
    .from("connections")
    .select("id")
    .eq("status", "active")
    .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
    .maybeSingle();
  if (active) redirect("/app/today");

  const { data: invites } = await supabase
    .from("connection_invites")
    .select("id, token, expires_at, accepted_at, revoked_at")
    .eq("creator_id", user.id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  const existing = invites?.[0]
    ? {
        id: invites[0].id,
        token: invites[0].token,
        expires_at: invites[0].expires_at,
      }
    : null;

  return (
    <SiteShell>
      <PublicHeader />
      <InviteCreate existing={existing} />
    </SiteShell>
  );
}
