"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reactionSchema } from "@/lib/validation/schemas";
import type { ReactionKind } from "@/types/database";

export async function toggleReaction(input: {
  dailyEntryId?: string;
  voiceDropId?: string;
  reaction: ReactionKind;
}) {
  const parsed = reactionSchema.safeParse(input.reaction);
  if (!parsed.success) {
    return { ok: false as const, error: "That reaction isn't available." };
  }
  if (Boolean(input.dailyEntryId) === Boolean(input.voiceDropId)) {
    return { ok: false as const, error: "Pick one thing to react to." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Please sign in again." };

  const query = supabase.from("reactions").select("id, reaction").eq("sender_id", user.id);
  const existingQuery = input.dailyEntryId
    ? query.eq("daily_entry_id", input.dailyEntryId)
    : query.eq("voice_drop_id", input.voiceDropId!);
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing?.reaction === parsed.data) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id)
      .eq("sender_id", user.id);
    if (error) return { ok: false as const, error: "Couldn't update that." };
    revalidatePath("/app/today");
    revalidatePath("/app/memories");
    return { ok: true as const, reaction: null };
  }

  if (existing) {
    const { error } = await supabase
      .from("reactions")
      .update({ reaction: parsed.data })
      .eq("id", existing.id)
      .eq("sender_id", user.id);
    if (error) return { ok: false as const, error: "Couldn't update that." };
  } else {
    const { error } = await supabase.from("reactions").insert({
      sender_id: user.id,
      daily_entry_id: input.dailyEntryId ?? null,
      voice_drop_id: input.voiceDropId ?? null,
      reaction: parsed.data,
    });
    if (error) return { ok: false as const, error: "Couldn't update that." };
  }

  revalidatePath("/app/today");
  revalidatePath("/app/memories");
  return { ok: true as const, reaction: parsed.data };
}
