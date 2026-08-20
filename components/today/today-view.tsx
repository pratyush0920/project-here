"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DailyCard } from "@/components/today/daily-card";
import { DailyComposer } from "@/components/today/daily-composer";
import { VoiceDropList, VoiceRecorder } from "@/components/voice/voice-drop";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { DailyEntry, Profile, Reaction, VoiceDrop } from "@/types/database";

export function TodayView({
  me,
  partner,
  connectionId,
  myEntry,
  partnerEntry,
  myPhotoUrl,
  partnerPhotoUrl,
  myDrops,
  partnerDrops,
  reactions,
}: {
  me: Profile;
  partner: Profile;
  connectionId: string;
  myEntry: DailyEntry | null;
  partnerEntry: DailyEntry | null;
  myPhotoUrl: string | null;
  partnerPhotoUrl: string | null;
  myDrops: Array<VoiceDrop & { audioUrl: string | null }>;
  partnerDrops: Array<VoiceDrop & { audioUrl: string | null }>;
  reactions: Reaction[];
}) {
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`space:${connectionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_entries", filter: `connection_id=eq.${connectionId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "voice_drops", filter: `connection_id=eq.${connectionId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "connections", filter: `id=eq.${connectionId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [connectionId, router]);

  const partnerReactions = (id: string, key: "daily_entry_id" | "voice_drop_id") =>
    reactions.filter((reaction) => reaction[key] === id);

  return (
    <div className="flex flex-col gap-10 pb-8">
      <section>
        <h2 className="text-lg font-medium">{partner.display_name}&apos;s today</h2>
        {partnerEntry ? (
          <div className="mt-4">
            <DailyCard
              entry={partnerEntry}
              reactions={partnerReactions(partnerEntry.id, "daily_entry_id")}
              photoUrl={partnerPhotoUrl}
              viewerTimeZone={me.timezone}
              currentUserId={me.id}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-[28px] border border-dashed border-border px-5 py-8">
            <p className="font-medium">{COPY.emptyPartner}</p>
            <p className="mt-2 text-sm text-muted">{COPY.emptyPartnerHint}</p>
          </div>
        )}
        {partnerDrops.length > 0 ? (
          <VoiceDropList
            drops={partnerDrops.map((drop) => ({
              ...drop,
              reactions: partnerReactions(drop.id, "voice_drop_id"),
            }))}
            currentUserId={me.id}
            viewerTimeZone={me.timezone}
          />
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-medium">My today</h2>
        {myEntry ? (
          <div className="mt-4">
            <DailyCard
              entry={myEntry}
              reactions={partnerReactions(myEntry.id, "daily_entry_id")}
              photoUrl={myPhotoUrl}
              viewerTimeZone={me.timezone}
              currentUserId={me.id}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Leave a little of your day, if you feel like it.</p>
        )}
        {myDrops.length > 0 ? (
          <VoiceDropList
            drops={myDrops.map((drop) => ({
              ...drop,
              reactions: partnerReactions(drop.id, "voice_drop_id"),
            }))}
            currentUserId={me.id}
            viewerTimeZone={me.timezone}
          />
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <Button type="button" onClick={() => setComposerOpen(true)}>
            {myEntry ? "Edit my today" : "Share a little of today"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setVoiceOpen(true)}>
            Leave a voice drop
          </Button>
        </div>
      </section>

      <DailyComposer
        connectionId={connectionId}
        userId={me.id}
        entry={myEntry}
        photoUrl={myPhotoUrl}
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          router.refresh();
        }}
      />
      {voiceOpen ? (
        <VoiceRecorder
          connectionId={connectionId}
          userId={me.id}
          onClose={() => {
            setVoiceOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
