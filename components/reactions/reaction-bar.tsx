"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toggleReaction } from "@/actions/reactions";
import { REACTION_COPY, type ReactionType } from "@/lib/constants";
import type { Reaction } from "@/types/database";

export function ReactionBar({
  dailyEntryId,
  voiceDropId,
  reactions,
  currentUserId,
}: {
  dailyEntryId?: string;
  voiceDropId?: string;
  reactions: Reaction[];
  currentUserId: string;
}) {
  const router = useRouter();
  const mine = reactions.find((reaction) => reaction.sender_id === currentUserId);
  const [optimistic, setOptimistic] = useOptimistic(mine?.reaction ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPick(reaction: ReactionType) {
    const next = optimistic === reaction ? null : reaction;
    startTransition(async () => {
      setOptimistic(next);
      const result = await toggleReaction({
        dailyEntryId,
        voiceDropId,
        reaction,
      });
      if (!result.ok) {
        setError("Couldn't update that.");
        setOptimistic(mine?.reaction ?? null);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1">
      {(Object.keys(REACTION_COPY) as ReactionType[]).map((key) => {
        const meta = REACTION_COPY[key];
        const active = optimistic === key;
        return (
          <button
            key={key}
            type="button"
            disabled={pending}
            onClick={() => onPick(key)}
            aria-pressed={active}
            aria-label={meta.label}
            className={`rounded-full px-3 py-1.5 text-sm transition-transform ${
              active
                ? "bg-surface-warm text-foreground"
                : "text-muted hover:bg-surface-warm/70 hover:text-foreground"
            } motion-safe:active:scale-95`}
          >
            <span aria-hidden>{meta.glyph}</span>
            <span className="ml-1.5 text-[13px]">{meta.label}</span>
          </button>
        );
      })}
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </div>
  );
}
