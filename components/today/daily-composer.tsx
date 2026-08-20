"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteDailyEntry, upsertDailyEntry } from "@/actions/daily-entry";
import { Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { PRESENCE_ICONS } from "@/components/today/presence-icons";
import {
  COPY,
  CUSTOM_STATUS_MAX,
  MOOD_COPY,
  MOODS,
  NOTE_MAX,
  PRESENCE_COPY,
  PRESENCE_STATUSES,
  type Mood,
  type PresenceStatus,
} from "@/lib/constants";
import { processPhoto } from "@/lib/media/photo";
import { createClient } from "@/lib/supabase/client";
import type { DailyEntry } from "@/types/database";

const DRAFT_KEY = "here:today-draft";

type Draft = {
  presenceStatus: PresenceStatus | null;
  customStatus: string;
  mood: Mood | null;
  note: string;
  songUrl: string;
  songTitle: string;
  songArtist: string;
};

function emptyDraft(): Draft {
  return {
    presenceStatus: null,
    customStatus: "",
    mood: null,
    note: "",
    songUrl: "",
    songTitle: "",
    songArtist: "",
  };
}

function fromEntry(entry: DailyEntry): Draft {
  return {
    presenceStatus: entry.presence_status,
    customStatus: entry.custom_status ?? "",
    mood: entry.mood,
    note: entry.note ?? "",
    songUrl: entry.song_url ?? "",
    songTitle: entry.song_title ?? "",
    songArtist: entry.song_artist ?? "",
  };
}

function readDraft(entry: DailyEntry | null): Draft {
  if (entry) return fromEntry(entry);
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...(JSON.parse(raw) as Draft) };
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return emptyDraft();
  }
}

export function DailyComposer({
  connectionId,
  userId,
  entry,
  photoUrl,
  open,
  onClose,
}: {
  connectionId: string;
  userId: string;
  entry: DailyEntry | null;
  photoUrl?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [draft, setDraftState] = useState<Draft>(() => readDraft(entry));
  const [photoPreview, setPhotoPreview] = useState<string | null>(photoUrl ?? null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  function setDraft(update: Draft | ((current: Draft) => Draft)) {
    setDraftState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      if (!entry) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  const nearLimit = draft.note.length > NOTE_MAX - 20;

  const canShare = useMemo(() => {
    return Boolean(
      draft.presenceStatus ||
        draft.mood ||
        draft.note.trim() ||
        draft.songUrl.trim() ||
        photoPreview,
    );
  }, [draft, photoPreview]);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const processed = await processPhoto(file);
      setPhotoBlob(processed.blob);
      setPhotoPreview(processed.previewUrl);
      setRemovePhoto(false);
      setError(null);
    } catch {
      setError(COPY.photoError);
    }
  }

  async function save() {
    setError(null);
    startTransition(async () => {
      let photoPath = entry?.photo_path ?? null;
      if (removePhoto) photoPath = null;
      if (photoBlob) {
        const supabase = createClient();
        const path = `${connectionId}/${userId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("daily-photos")
          .upload(path, photoBlob, { contentType: "image/webp", upsert: false });
        if (uploadError) {
          setError(COPY.photoError);
          return;
        }
        photoPath = path;
      }

      const result = await upsertDailyEntry({
        presenceStatus: draft.presenceStatus,
        customStatus: draft.customStatus,
        mood: draft.mood,
        note: draft.note,
        songUrl: draft.songUrl,
        songTitle: draft.songTitle,
        songArtist: draft.songArtist,
        photoPath,
        removePhoto,
      });

      if (!result.ok && "emptyExisting" in result && result.emptyExisting) {
        setConfirmDelete(true);
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      sessionStorage.removeItem(DRAFT_KEY);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 700);
    });
  }

  async function removeToday() {
    if (!entry) return;
    startTransition(async () => {
      const result = await deleteDailyEntry(entry.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none bg-transparent p-0 backdrop:bg-foreground/30 open:flex open:flex-col open:justify-end md:open:justify-center"
    >
      <form
        method="dialog"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 md:mx-auto md:max-w-[560px] md:rounded-[28px]"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border md:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {entry ? "Edit my today" : "Share a little of today"}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <section className="mt-6">
          <h3 className="text-sm font-medium">Where are you at?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESENCE_STATUSES.map((status) => {
              const Icon = PRESENCE_ICONS[status];
              const selected = draft.presenceStatus === status;
              const label =
                status === "custom" ? "Custom" : PRESENCE_COPY[status].label;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      presenceStatus: selected ? null : status,
                    }))
                  }
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                    selected ? "bg-accent-strong text-white" : "bg-surface-warm"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
          {draft.presenceStatus === "custom" ? (
            <TextInput
              className="mt-3 w-full"
              maxLength={CUSTOM_STATUS_MAX}
              value={draft.customStatus}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  customStatus: event.target.value,
                }))
              }
              placeholder="A few words"
              aria-label="Custom status"
            />
          ) : null}
        </section>

        <section className="mt-8">
          <h3 className="text-sm font-medium">How are you feeling?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {MOODS.map((mood) => {
              const selected = draft.mood === mood;
              return (
                <button
                  key={mood}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      mood: selected ? null : mood,
                    }))
                  }
                  className={`rounded-full px-3 py-2 text-sm ${
                    selected ? "bg-accent-strong text-white" : "bg-surface-warm"
                  }`}
                >
                  {MOOD_COPY[mood]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <Field label="What's in your head?">
            <TextArea
              rows={3}
              maxLength={NOTE_MAX}
              value={draft.note}
              onChange={(event) =>
                setDraft((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="A small thought is enough."
            />
            {nearLimit ? (
              <span className="self-end text-xs text-muted">
                {draft.note.length}/{NOTE_MAX}
              </span>
            ) : null}
          </Field>
        </section>

        <section className="mt-8">
          <h3 className="text-sm font-medium">A glimpse</h3>
          {photoPreview ? (
            <div className="mt-3 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview of today's photo" className="max-h-64 w-full object-cover" />
              <Button
                type="button"
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoBlob(null);
                  setRemovePhoto(true);
                }}
              >
                Remove photo
              </Button>
            </div>
          ) : (
            <label className="mt-3 flex min-h-24 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-sm text-muted">
              Add a photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => onPhoto(event.target.files?.[0])}
              />
            </label>
          )}
        </section>

        <section className="mt-8 space-y-3">
          <h3 className="text-sm font-medium">On repeat</h3>
          <TextInput
            value={draft.songUrl}
            onChange={(event) =>
              setDraft((current) => ({ ...current, songUrl: event.target.value }))
            }
            placeholder="https://…"
            inputMode="url"
            aria-label="Song link"
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              value={draft.songTitle}
              onChange={(event) =>
                setDraft((current) => ({ ...current, songTitle: event.target.value }))
              }
              placeholder="Title"
              aria-label="Song title"
            />
            <TextInput
              value={draft.songArtist}
              onChange={(event) =>
                setDraft((current) => ({ ...current, songArtist: event.target.value }))
              }
              placeholder="Artist"
              aria-label="Song artist"
            />
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        {saved ? <p className="mt-4 text-sm text-accent-strong">{COPY.saved}</p> : null}

        {confirmDelete ? (
          <div className="mt-6 rounded-2xl bg-surface-warm p-4">
            <p className="text-sm">Remove today&apos;s entry?</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="danger" onClick={removeToday} disabled={pending}>
                Delete
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep editing
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-2">
            <Button type="button" onClick={save} disabled={pending || !canShare}>
              {entry ? "Save changes" : "Share"}
            </Button>
            {entry ? (
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
                Delete today&apos;s entry
              </Button>
            ) : null}
          </div>
        )}
      </form>
    </dialog>
  );
}
