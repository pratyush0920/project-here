"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteAccount } from "@/actions/account";
import { endConnection } from "@/actions/connections";
import { signOut, updateAvatarPath, updateProfile } from "@/actions/profile";
import { Button, Field, TextInput } from "@/components/ui/button";
import { COPY } from "@/lib/constants";
import { listTimeZones } from "@/lib/dates/timezone";
import { processPhoto } from "@/lib/media/photo";
import { createClient } from "@/lib/supabase/client";
import type { Connection, Profile } from "@/types/database";

export function SettingsView({
  me,
  partner,
  connection,
  avatarUrl,
}: {
  me: Profile;
  partner: Profile | null;
  connection: Connection | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const zones = listTimeZones();
  const [name, setName] = useState(me.display_name);
  const [timezone, setTimezone] = useState(me.timezone);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [preview, setPreview] = useState(avatarUrl);

  return (
    <div className="space-y-10 pb-8">
      <section>
        <h1 className="text-xl font-medium">Settings</h1>
        <p className="mt-2 text-sm text-muted">Quiet controls. Nothing here is scored.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Profile</h2>
        <div className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-warm">
              {me.display_name.slice(0, 1)}
            </span>
          )}
          <label className="text-sm text-accent-strong">
            Change photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const processed = await processPhoto(file);
                  setPreview(processed.previewUrl);
                  const supabase = createClient();
                  const path = `${me.id}/${crypto.randomUUID()}.webp`;
                  const { error } = await supabase.storage
                    .from("avatars")
                    .upload(path, processed.blob, { contentType: "image/webp" });
                  if (error) {
                    setMessage("That photo didn't make it through. Try another one.");
                    return;
                  }
                  await updateAvatarPath(path);
                  router.refresh();
                } catch {
                  setMessage("That photo didn't make it through. Try another one.");
                }
              }}
            />
          </label>
        </div>
        <Field label="What should we call you?">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={50} />
        </Field>
        <Field
          label="Where's your day happening?"
          hint="This keeps your daily updates on the right day when you're in different time zones."
        >
          <select
            className="min-h-12 rounded-2xl border border-border bg-surface px-4 text-[16px]"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Field>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateProfile({ displayName: name, timezone });
              setMessage(result.ok ? COPY.saved : result.error);
            })
          }
        >
          Save profile
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Your space</h2>
        {partner && connection ? (
          <>
            <p>
              {partner.display_name}
              <span className="block text-sm text-muted">
                Together since{" "}
                {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                  new Date(connection.created_at),
                )}
              </span>
            </p>
            {confirmDisconnect ? (
              <div className="rounded-2xl bg-surface-warm p-4">
                <p className="text-sm">{COPY.disconnectBody}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() =>
                      startTransition(async () => {
                        await endConnection(connection.id);
                        router.replace("/app/today");
                      })
                    }
                  >
                    Disconnect
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmDisconnect(false)}>
                    Keep this space
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirmDisconnect(true)}>
                Disconnect this space
              </Button>
            )}
          </>
        ) : (
          <Link href="/invite" className="text-sm text-accent-strong">
            Invite someone
          </Link>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Privacy</h2>
        <p className="text-sm text-muted">
          Your updates are visible only to you and the person in your active space.
          Presence is something you choose. Here never shows last seen, read receipts, or
          whether someone is online.
        </p>
        <a href="/app/settings/privacy" className="text-sm text-accent-strong">
          Read a little more
        </a>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Account</h2>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            startTransition(async () => {
              await signOut();
              router.replace("/");
            })
          }
        >
          Sign out
        </Button>
        {confirmDelete ? (
          <div className="rounded-2xl bg-surface-warm p-4">
            <p className="text-sm">
              This removes your account and your media. It cannot be undone from Here.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="danger"
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteAccount();
                    if (result && !result.ok) setMessage(result.error);
                  })
                }
              >
                Delete my account
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep my account
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
            Delete account
          </Button>
        )}
      </section>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
