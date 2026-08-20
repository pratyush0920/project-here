import Link from "next/link";
import { DailyCard } from "@/components/today/daily-card";
import { VoiceDropList } from "@/components/voice/voice-drop";
import { COPY } from "@/lib/constants";
import { profileComplete } from "@/lib/connections/helpers";
import { getActiveSpace, getUserAndProfile, signedUrl } from "@/lib/data/space";
import {
  formatLongDate,
  formatMonthHeading,
  monthBounds,
  shiftMonth,
} from "@/lib/dates/timezone";
import { redirect } from "next/navigation";
import type { DailyEntry, Profile, Reaction, VoiceDrop } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { user, profile, supabase } = await getUserAndProfile();
  if (!user || !profile) redirect("/login");
  if (!profileComplete(profile)) redirect("/onboarding");
  const { connection, partner } = await getActiveSpace(user.id);
  if (!connection || !partner) {
    return <p className="text-muted">{COPY.noMemories} Connect someone first.</p>;
  }

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;
  const { start, end } = monthBounds(year, month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const [{ data: entries }, { data: drops }] = await Promise.all([
    supabase
      .from("daily_entries")
      .select("*")
      .eq("connection_id", connection.id)
      .gte("local_date", start)
      .lte("local_date", end)
      .order("local_date", { ascending: true }),
    supabase
      .from("voice_drops")
      .select("*")
      .eq("connection_id", connection.id)
      .gte("local_date", start)
      .lte("local_date", end)
      .order("created_at", { ascending: true }),
  ]);

  const daily = (entries ?? []) as DailyEntry[];
  const voices = (drops ?? []) as VoiceDrop[];
  const entryIds = daily.map((row) => row.id);
  const dropIds = voices.map((row) => row.id);

  let reactions: Reaction[] = [];
  if (entryIds.length || dropIds.length) {
    const filters = [
      entryIds.length ? `daily_entry_id.in.(${entryIds.join(",")})` : null,
      dropIds.length ? `voice_drop_id.in.(${dropIds.join(",")})` : null,
    ].filter(Boolean) as string[];
    const { data } = await supabase.from("reactions").select("*").or(filters.join(","));
    reactions = (data ?? []) as Reaction[];
  }

  const authors: Record<string, Profile> = {
    [profile.id]: profile,
    [partner.id]: partner,
  };

  const photoUrls = new Map<string, string | null>();
  await Promise.all(
    daily.map(async (entry) => {
      photoUrls.set(entry.id, await signedUrl("daily-photos", entry.photo_path));
    }),
  );
  const audioUrls = new Map<string, string | null>();
  await Promise.all(
    voices.map(async (drop) => {
      audioUrls.set(drop.id, await signedUrl("voice-drops", drop.storage_path));
    }),
  );

  const days = new Map<string, { entries: DailyEntry[]; drops: VoiceDrop[] }>();
  for (const row of daily) {
    const bucket = days.get(row.local_date) ?? { entries: [], drops: [] };
    bucket.entries.push(row);
    days.set(row.local_date, bucket);
  }
  for (const drop of voices) {
    const bucket = days.get(drop.local_date) ?? { entries: [], drops: [] };
    bucket.drops.push(drop);
    days.set(drop.local_date, bucket);
  }

  const sortedDays = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href={`/app/memories?year=${prev.year}&month=${prev.month}`}
          className="text-sm text-muted"
        >
          Previous
        </Link>
        <h1 className="text-xl font-medium">{formatMonthHeading(year, month)}</h1>
        <Link
          href={`/app/memories?year=${next.year}&month=${next.month}`}
          className="text-sm text-muted"
        >
          Next
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">Our ordinary days, kept quietly.</p>

      {sortedDays.length === 0 ? (
        <p className="mt-10 text-muted">{COPY.noMemories}</p>
      ) : (
        <ol className="mt-8 space-y-10">
          {sortedDays.map(([iso, bucket]) => (
            <li key={iso}>
              <h2 className="mb-4 text-sm font-medium text-muted">
                {formatLongDate(iso, "UTC")}
              </h2>
              <div className="space-y-4">
                {bucket.entries.map((entry) => {
                  const author = authors[entry.user_id];
                  return (
                    <div key={entry.id}>
                      <p className="mb-2 text-sm text-muted">
                        {author?.display_name ?? "Someone"}
                      </p>
                      <DailyCard
                        entry={entry}
                        reactions={reactions.filter((r) => r.daily_entry_id === entry.id)}
                        photoUrl={photoUrls.get(entry.id)}
                        viewerTimeZone={profile.timezone}
                        currentUserId={user.id}
                      />
                    </div>
                  );
                })}
                {bucket.drops.length > 0 ? (
                  <VoiceDropList
                    drops={bucket.drops.map((drop) => ({
                      ...drop,
                      audioUrl: audioUrls.get(drop.id) ?? null,
                      reactions: reactions.filter((r) => r.voice_drop_id === drop.id),
                    }))}
                    currentUserId={user.id}
                    viewerTimeZone={profile.timezone}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
