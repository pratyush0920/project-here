"use server";

import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(input: {
  displayName: string;
  timezone: string;
}) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check that form." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Please sign in again." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: parsed.data.displayName,
    timezone: parsed.data.timezone,
    onboarding_completed_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false as const, error: "Couldn't save that. Your update is still here, so try once more." };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function updateProfile(input: {
  displayName: string;
  timezone: string;
}) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check that form." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Please sign in again." };
  }
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      timezone: parsed.data.timezone,
    })
    .eq("id", user.id);
  if (error) {
    return { ok: false as const, error: "Couldn't save that. Your update is still here, so try once more." };
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function updateAvatarPath(path: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Please sign in again." };
  }
  const { data: current } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", user.id);
  if (error) {
    return { ok: false as const, error: "Couldn't save that. Your update is still here, so try once more." };
  }
  if (current?.avatar_path && current.avatar_path !== path) {
    await supabase.storage.from("avatars").remove([current.avatar_path]);
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
