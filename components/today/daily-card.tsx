import { Music2 } from "lucide-react";
import { PRESENCE_COPY, MOOD_COPY, type PresenceStatus } from "@/lib/constants";
import { formatClock } from "@/lib/dates/timezone";
import { identifySongProvider, songProviderLabel } from "@/lib/media/helpers";
import { PRESENCE_ICONS } from "@/components/today/presence-icons";
import { ReactionBar } from "@/components/reactions/reaction-bar";
import type { DailyEntry, Reaction } from "@/types/database";

export function DailyCard({
  entry,
  reactions,
  photoUrl,
  viewerTimeZone,
  currentUserId,
  compact = false,
}: {
  entry: DailyEntry;
  reactions: Reaction[];
  photoUrl?: string | null;
  viewerTimeZone: string;
  currentUserId: string;
  compact?: boolean;
}) {
  const status = entry.presence_status as PresenceStatus | null;
  const Icon = status ? PRESENCE_ICONS[status] : null;
  const statusLabel =
    status === "custom"
      ? entry.custom_status
      : status
        ? PRESENCE_COPY[status].label
        : null;
  const provider = entry.song_url ? identifySongProvider(entry.song_url) : null;

  return (
    <article className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {Icon ? <Icon className="h-4 w-4 text-accent" aria-hidden /> : null}
          <span>{statusLabel ?? "A quiet note"}</span>
        </div>
        <time className="text-sm text-muted" dateTime={entry.updated_at}>
          {formatClock(entry.updated_at, viewerTimeZone)}
        </time>
      </header>

      {entry.mood ? (
        <p className="mt-4 text-sm text-muted">feeling {MOOD_COPY[entry.mood].toLowerCase()}</p>
      ) : null}

      {entry.note ? (
        <p className={`mt-3 text-[17px] leading-relaxed ${compact ? "" : ""}`}>{entry.note}</p>
      ) : null}

      {photoUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl bg-surface-warm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={entry.note ? "" : "A photo from today"}
            className="max-h-80 w-full object-cover"
          />
        </div>
      ) : null}

      {entry.song_url ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-warm px-4 py-3">
          <Music2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {entry.song_title || "On repeat"}
            </p>
            <p className="truncate text-sm text-muted">
              {entry.song_artist || (provider ? songProviderLabel(provider) : "A song")}
            </p>
          </div>
          <a
            href={entry.song_url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-sm font-medium text-accent-strong"
          >
            Listen
          </a>
        </div>
      ) : null}

      <ReactionBar
        dailyEntryId={entry.id}
        reactions={reactions}
        currentUserId={currentUserId}
      />
    </article>
  );
}
