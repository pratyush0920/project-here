"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/actions/profile";
import { Button, Field, TextInput } from "@/components/ui/button";
import { listTimeZones } from "@/lib/dates/timezone";

export function OnboardingFlow({ detectedZone }: { detectedZone: string }) {
  const router = useRouter();
  const zones = useMemo(() => listTimeZones(), []);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(detectedZone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-10">
      {step === 0 ? (
        <>
          <h1 className="text-2xl font-medium">What should we call you?</h1>
          <p className="mt-2 text-sm text-muted">Just a name your person will recognise.</p>
          <Field label="Your name">
            <TextInput
              className="mt-6"
              value={name}
              maxLength={50}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Field>
          <Button
            className="mt-6 w-full"
            type="button"
            onClick={() => name.trim() && setStep(1)}
          >
            Continue
          </Button>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <h1 className="text-2xl font-medium">Where&apos;s your day happening?</h1>
          <p className="mt-2 text-sm text-muted">
            This keeps your daily updates on the right day when you&apos;re in different time
            zones.
          </p>
          <Field label="Timezone">
            <select
              className="mt-6 min-h-12 rounded-2xl border border-border bg-surface px-4 text-[16px]"
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
            className="mt-6 w-full"
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await completeOnboarding({
                  displayName: name,
                  timezone,
                });
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.replace("/invite");
              })
            }
          >
            Continue
          </Button>
        </>
      ) : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
