"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/actions/connections";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function AcceptInvite({
  token,
  name,
  avatarUrl,
  signedIn,
}: {
  token: string;
  name: string;
  avatarUrl: string | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-12 text-center">
      <div className="flex justify-center">
        <Avatar name={name} src={avatarUrl} size={64} />
      </div>
      <h1 className="mt-6 text-2xl font-medium">{name} invited you to Here.</h1>
      <p className="mt-3 text-muted">
        A quiet private space for the little parts of your days.
      </p>
      <p className="mt-2 text-sm text-muted">Join this private space with {name}?</p>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-8 flex flex-col gap-2">
        {signedIn ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await acceptInvite(token);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.replace("/app/today");
              })
            }
          >
            Join space
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() =>
              router.push(
                `/login?next=${encodeURIComponent(`/invite/${token}`)}&invite=${token}`,
              )
            }
          >
            Continue with email
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => router.push("/")}>
          Not now
        </Button>
      </div>
    </div>
  );
}
