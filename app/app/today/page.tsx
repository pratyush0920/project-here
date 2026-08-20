import Link from "next/link";
import { TodayView } from "@/components/today/today-view";
import { COPY } from "@/lib/constants";
import { getActiveSpace, getUserAndProfile, signedUrl } from "@/lib/data/space";
import { localDateInTimeZone } from "@/lib/dates/timezone";
import { profileComplete } from "@/lib/connections/helpers";
import { redirect } from "next/navigation";
import type { DailyEntry, Reaction, VoiceDrop } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const { user, profile, supabase } = await getUserAndProfile();
  if (!user || !profile) redirect("/login");
  if (!profileComplete(profile)) redirect("/onboarding");

  const { connection, partner } = await getActiveSpace(user.id);
  if (!connection || !partner) {
    return (
      <div className="rounded-[28px] border border-border bg-surface p-6">
        <p className="text-lg font-medium">{COPY.noConnection}</p>
        <p className="mt-2 text-sm text-muted">{COPY.noConnectionHint}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/invite"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-strong px-5 text-[15px] font-medium text-white"
          >
            Invite someone
          </Link>
          <Link href="/invite" className="text-center text-sm text-muted">
            I have an invite
          </Link>
        </div>
      </div>
    );
  }

  const myDate = localDateInTimeZone(profile.timezone);
  const partnerDate = localDateInTimeZone(partner.timezone);

  const { data: entries } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("connection_id", connection.id)
    .or(
      `and(user_id.eq.${user.id},local_date.eq.${myDate}),and(user_id.eq.${partner.id},local_date.eq.${partnerDate})`,
    );

  const myEntry = (entries ?? []).find((row) => row.user_id === user.id) as DailyEntry | undefined;
  const partnerEntry = (entries ?? []).find((row) => row.user_id === partner.id) as
    | DailyEntry
    | undefined;

  const { data: drops } = await supabase
    .from("voice_drops")
    .select("*")
    .eq("connection_id", connection.id)
    .or(
      `and(sender_id.eq.${user.id},local_date.eq.${myDate}),and(sender_id.eq.${partner.id},local_date.eq.${partnerDate})`,
    )
    .order("created_at", { ascending: true });

  const allDrops = (drops ?? []) as VoiceDrop[];
  const entryIds = [myEntry?.id, partnerEntry?.id].filter(Boolean) as string[];
  const dropIds = allDrops.map((drop) => drop.id);

  let reactions: Reaction[] = [];
  if (entryIds.length || dropIds.length) {
    const filters = [
      entryIds.length ? `daily_entry_id.in.(${entryIds.join(",")})` : null,
      dropIds.length ? `voice_drop_id.in.(${dropIds.join(",")})` : null,
    ].filter(Boolean) as string[];
    const { data } = await supabase.from("reactions").select("*").or(filters.join(","));
    reactions = (data ?? []) as Reaction[];
  }

  async function withAudio(list: VoiceDrop[]) {
    return Promise.all(
      list.map(async (drop) => ({
        ...drop,
        audioUrl: await signedUrl("voice-drops", drop.storage_path),
      })),
    );
  }

  return (
    <TodayView
      me={profile}
      partner={partner}
      connectionId={connection.id}
      myEntry={myEntry ?? null}
      partnerEntry={partnerEntry ?? null}
      myPhotoUrl={await signedUrl("daily-photos", myEntry?.photo_path ?? null)}
      partnerPhotoUrl={await signedUrl("daily-photos", partnerEntry?.photo_path ?? null)}
      myDrops={await withAudio(allDrops.filter((drop) => drop.sender_id === user.id))}
      partnerDrops={await withAudio(allDrops.filter((drop) => drop.sender_id === partner.id))}
      reactions={reactions}
    />
  );
}
