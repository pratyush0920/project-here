"use client";

import { useSyncExternalStore } from "react";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

function subscribe() {
  return () => undefined;
}

function browserZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function DetectedOnboarding() {
  const zone = useSyncExternalStore(subscribe, browserZone, () => "UTC");
  return <OnboardingFlow detectedZone={zone} />;
}
