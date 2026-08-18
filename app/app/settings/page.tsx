import { SettingsView } from "@/components/settings/settings-view";
import { profileComplete } from "@/lib/connections/helpers";
import { getActiveSpace, getUserAndProfile, signedUrl } from "@/lib/data/space";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user || !profile) redirect("/login");
  if (!profileComplete(profile)) redirect("/onboarding");
  const { connection, partner } = await getActiveSpace(user.id);
  return (
    <SettingsView
      me={profile}
      partner={partner}
      connection={connection}
      avatarUrl={await signedUrl("avatars", profile.avatar_path)}
    />
  );
}
