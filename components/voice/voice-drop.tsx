"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createVoiceDrop, deleteVoiceDrop } from "@/actions/voice-drop";
import { Button } from "@/components/ui/button";
import { ReactionBar } from "@/components/reactions/reaction-bar";
import { COPY, VOICE_MAX_SECONDS } from "@/lib/constants";
import { formatClock } from "@/lib/dates/timezone";
import { extensionForMime, pickRecorderMimeType } from "@/lib/media/helpers";
import { createClient } from "@/lib/supabase/client";
import type { Reaction, VoiceDrop } from "@/types/database";

export function VoiceDropList({
  drops,
  currentUserId,
  viewerTimeZone,
}: {
  drops: Array<VoiceDrop & { audioUrl?: string | null; reactions: Reaction[] }>;
  currentUserId: string;
  viewerTimeZone: string;
}) {
  if (drops.length === 0) return null;
  return (
    <ul className="mt-4 space-y-3">
      {drops.map((drop) => (
        <li key={drop.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Voice drop</span>
            <time dateTime={drop.created_at}>
              {formatClock(drop.created_at, viewerTimeZone)}
            </time>
          </div>
          {drop.audioUrl ? (
            <audio className="mt-2 w-full" controls src={drop.audioUrl} preload="none">
              Your browser can&apos;t play this voice drop.
            </audio>
          ) : (
            <p className="mt-2 text-sm text-muted">Audio isn&apos;t available right now.</p>
          )}
          <ReactionBar
            voiceDropId={drop.id}
            reactions={drop.reactions}
            currentUserId={currentUserId}
          />
          {drop.sender_id === currentUserId ? (
            <DeleteVoiceButton id={drop.id} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function DeleteVoiceButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      className="mt-1 min-h-8 px-0 text-sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteVoiceDrop(id);
        })
      }
    >
      Remove
    </Button>
  );
}

export function VoiceRecorder({
  connectionId,
  userId,
  onClose,
}: {
  connectionId: string;
  userId: string;
  onClose: () => void;
}) {
  const mime = pickRecorderMimeType();
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function finishRecording() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    setRecording(false);
  }

  async function start() {
    setError(null);
    setPreviewUrl(null);
    setBlob(null);
    if (!mime || !navigator.mediaDevices) {
      setError("This browser can’t record a voice drop.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: mime });
        setBlob(recorded);
        setPreviewUrl(URL.createObjectURL(recorded));
        stopTracks();
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        setSeconds(Math.min(VOICE_MAX_SECONDS, elapsed));
        if (elapsed >= VOICE_MAX_SECONDS) finishRecording();
      }, 200);
    } catch {
      setError("Microphone access is needed for a voice drop.");
    }
  }

  async function send() {
    if (!blob || sending) return;
    setSending(true);
    setError(null);
    const duration = Math.min(
      VOICE_MAX_SECONDS,
      Math.max(0.2, blob ? seconds || 0.2 : 0.2),
    );
    const supabase = createClient();
    const ext = extensionForMime(mime ?? blob.type);
    const path = `${connectionId}/${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("voice-drops")
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (uploadError) {
      setSending(false);
      setError(COPY.voiceError);
      return;
    }
    const result = await createVoiceDrop({
      storagePath: path,
      mimeType: blob.type,
      durationSeconds: duration,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
    setTimeout(onClose, 800);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/30 p-0 md:items-center">
      <div className="w-full max-w-[560px] rounded-t-[28px] bg-background px-5 py-5 md:rounded-[28px]">
        <h2 className="text-lg font-medium">Drop 30 seconds of your world</h2>
        {!mime ? (
          <p className="mt-4 text-sm text-muted">
            This browser can&apos;t record audio. Try another one, or skip the voice drop.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {recording
                ? `${Math.floor(seconds)}s / ${VOICE_MAX_SECONDS}s`
                : previewUrl
                  ? "Preview, then send when it feels right."
                  : "No one is notified. They’ll hear it when they open Here."}
            </p>
            {previewUrl ? (
              <audio className="mt-4 w-full" controls src={previewUrl} />
            ) : null}
            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            {sent ? <p className="mt-3 text-sm text-accent-strong">{COPY.voiceSent}</p> : null}
            <div className="mt-6 flex flex-col gap-2">
              {!previewUrl ? (
                <Button type="button" onClick={recording ? finishRecording : start}>
                  {recording ? "Stop" : "Record"}
                </Button>
              ) : (
                <>
                  <Button type="button" onClick={send} disabled={sending}>
                    Send
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setPreviewUrl(null);
                      setBlob(null);
                      setSeconds(0);
                    }}
                  >
                    Re-record
                  </Button>
                </>
              )}
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
