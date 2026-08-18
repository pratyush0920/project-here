"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpace } from "@/lib/data/space";
import { localDateInTimeZone } from "@/lib/dates/timezone";
import {
  dailyEntryInputSchema,
  isDailyEntryEmpty,
} from "@/lib/validation/schemas";
import { COPY } from "@/lib/constants";

export async function upsertDailyEntry(input: unknown) {
  const parsed = dailyEntryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? COPY.saveError,
    };
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
  if (!profile) return { ok: false as const, error: COPY.saveError };

  const { connection } = await getActiveSpace(user.id);
  if (!connection) {
    return { ok: false as const, error: "Connect your person before sharing a day." };
  }

  const timezone = profile.timezone;
  const localDate = localDateInTimeZone(timezone);
  const data = parsed.data;

  const shared = {
    timezone_snapshot: timezone,
    presence_status: data.presenceStatus ?? null,
    custom_status:
      data.presenceStatus === "custom"
        ? (data.customStatus?.trim() || null)
        : null,
    mood: data.mood ?? null,
    note: data.note?.trim() || null,
    song_url: data.songUrl?.trim() || null,
    song_title: data.songTitle?.trim() || null,
    song_artist: data.songArtist?.trim() || null,
  };

  const { data: existing } = await supabase
    .from("daily_entries")
    .select("id, photo_path")
    .eq("connection_id", connection.id)
    .eq("user_id", user.id)
    .eq("local_date", localDate)
    .maybeSingle();

  if (!existing && isDailyEntryEmpty(data) && !data.photoPath) {
    return { ok: false as const, error: "Add a little something before sharing." };
  }

  if (existing) {
    const nextPhoto =
      data.removePhoto ? null : (data.photoPath ?? existing.photo_path);
    const emptied =
      !shared.presence_status &&
      !shared.custom_status &&
      !shared.mood &&
      !shared.note &&
      !shared.song_url &&
      !nextPhoto;
    if (emptied) {
      return { ok: false as const, emptyExisting: true as const };
    }
    const { error } = await supabase
      .from("daily_entries")
      .update({
        ...shared,
        photo_path: nextPhoto,
      })
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false as const, error: COPY.saveError };
    }
    if (existing.photo_path && existing.photo_path !== nextPhoto) {
      await supabase.storage.from("daily-photos").remove([existing.photo_path]);
    }
  } else {
    const { error } = await supabase.from("daily_entries").insert({
      connection_id: connection.id,
      user_id: user.id,
      local_date: localDate,
      ...shared,
      photo_path: data.photoPath ?? null,
    });
    if (error) {
      if (data.photoPath) {
        await supabase.storage.from("daily-photos").remove([data.photoPath]);
      }
      return { ok: false as const, error: COPY.saveError };
    }
  }

  revalidatePath("/app/today");
  revalidatePath("/app/memories");
  return { ok: true as const };
}

export async function deleteDailyEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Please sign in again." };

  const { data: entry } = await supabase
    .from("daily_entries")
    .select("id, photo_path, user_id")
    .eq("id", entryId)
    .maybeSingle();

  if (!entry || entry.user_id !== user.id) {
    return { ok: false as const, error: "You can only remove your own day." };
  }

  const { error } = await supabase
    .from("daily_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, error: COPY.saveError };
  if (entry.photo_path) {
    await supabase.storage.from("daily-photos").remove([entry.photo_path]);
  }
  revalidatePath("/app/today");
  revalidatePath("/app/memories");
  return { ok: true as const };
}
