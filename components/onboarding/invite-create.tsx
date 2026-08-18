"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvite, revokeInvite } from "@/actions/connections";
import { Button, Field, TextInput } from "@/components/ui/button";
import { inviteUrl } from "@/lib/env";

export function InviteCreate({
  existing,
}: {
  existing: { id: string; token: string; expires_at: string } | null;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState(existing);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const link = invite ? inviteUrl(invite.token) : null;
  const canShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h1 className="text-2xl font-medium">Who do you want to share this space with?</h1>
        <p className="mt-2 text-sm text-muted">One person. Send this privately.</p>
        {invite && link ? (
          <div className="mt-6 space-y-3">
            <p className="text-lg font-medium">Your space is ready.</p>
            <p className="text-sm text-muted">
              Send this privately to the person you want here. The invite expires in 7 days and
              works once.
            </p>
            <p className="break-all rounded-2xl bg-surface-warm px-4 py-3 text-sm">{link}</p>
            <Button
              type="button"
              className="w-full"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied("link");
              }}
            >
              {copied === "link" ? "Copied" : "Copy invite"}
            </Button>
            {canShare ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  navigator.share({
                    title: "Here",
                    text: "A quiet private space for the little parts of our days.",
                    url: link,
                  })
                }
              >
                Share
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await navigator.clipboard.writeText(invite.token);
                setCopied("code");
              }}
            >
              {copied === "code" ? "Code copied" : "Copy code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await revokeInvite(invite.id);
                  setInvite(null);
                })
              }
            >
              Revoke invite
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            className="mt-6 w-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await createInvite();
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setInvite(result.invite);
              })
            }
          >
            Invite someone
          </Button>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium">I have an invite</h2>
        <Field label="Invite code">
          <TextInput
            className="mt-2"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Paste the code"
          />
        </Field>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => router.push(`/invite/${code.trim()}`)}
          disabled={!code.trim()}
        >
          Open invite
        </Button>
      </section>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
