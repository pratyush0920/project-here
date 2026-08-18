import { DetectedOnboarding } from "@/components/onboarding/detected-onboarding";
import { PublicHeader, SiteShell } from "@/components/layout/site-shell";
import { getUserAndProfile } from "@/lib/data/space";
import { profileComplete } from "@/lib/connections/helpers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?next=/onboarding");
  if (profileComplete(profile)) redirect("/app/today");

  return (
    <SiteShell>
      <PublicHeader />
      <DetectedOnboarding />
    </SiteShell>
  );
}
