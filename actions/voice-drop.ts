"use server";

import { revalidatePath } from "next/cache";
import { COPY, VOICE_MAX_SECONDS } from "@/lib/constants";
import { getActiveSpace } from "@/lib/data/space";
import { localDateInTimeZone } from "@/lib/dates/timezone";
import { createClient } from "@/lib/supabase/server";
import { voiceDurationSchema } from "@/lib/validation/schemas";

export async function createVoiceDrop(input: {
  storagePath: string;
  mimeType: string;
  durationSeconds: number;
}) {
  const duration = voiceDurationSchema.safeParse(input.durationSeconds);
  if (!duration.success) {
    return {
      ok: false as const,
      error: `Keep it to ${VOICE_MAX_SECONDS} seconds.`,
    };
  }
  if (!input.storagePath || !input.mimeType) {
    return { ok: false as const, error: COPY.voiceError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Please sign in again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const { connection } = await getActiveSpace(user.id);
  if (!connection || !profile) {
    return { ok: false as const, error: COPY.voiceError };
  }

  const { error } = await supabase.from("voice_drops").insert({
    connection_id: connection.id,
    sender_id: user.id,
    storage_path: input.storagePath,
    mime_type: input.mimeType.slice(0, 100),
    duration_seconds: duration.data,
    local_date: localDateInTimeZone(profile.timezone),
    timezone_snapshot: profile.timezone,
  });

  if (error) {
    await supabase.storage.from("voice-drops").remove([input.storagePath]);
    return { ok: false as const, error: COPY.voiceError };
  }

  revalidatePath("/app/today");
  revalidatePath("/app/memories");
  return { ok: true as const };
}

export async function deleteVoiceDrop(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Please sign in again." };

  const { data: drop } = await supabase
    .from("voice_drops")
    .select("id, sender_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!drop || drop.sender_id !== user.id) {
    return { ok: false as const, error: "You can only remove your own voice drop." };
  }
  const { error } = await supabase
    .from("voice_drops")
    .delete()
    .eq("id", id)
    .eq("sender_id", user.id);
  if (error) return { ok: false as const, error: COPY.voiceError };
  await supabase.storage.from("voice-drops").remove([drop.storage_path]);
  revalidatePath("/app/today");
  revalidatePath("/app/memories");
  return { ok: true as const };
}
