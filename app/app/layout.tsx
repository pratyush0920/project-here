import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import { Wordmark } from "@/components/brand/wordmark";
import { Avatar } from "@/components/ui/avatar";
import { formatHeaderDate } from "@/lib/dates/timezone";
import { getUserAndProfile, signedUrl } from "@/lib/data/space";
import { profileComplete } from "@/lib/connections/helpers";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?next=/app/today");
  if (!profileComplete(profile)) redirect("/onboarding");

  const avatarUrl = await signedUrl("avatars", profile!.avatar_path);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between py-2">
        <div>
          <Wordmark href="/app/today" size="sm" />
          <p className="mt-1 text-sm text-muted">{formatHeaderDate(profile!.timezone)}</p>
        </div>
        <a href="/app/settings/profile" aria-label="Profile settings">
          <Avatar name={profile!.display_name} src={avatarUrl} />
        </a>
      </header>
      <div className="flex-1 pt-6">{children}</div>
      <AppNav />
    </div>
  );
}
