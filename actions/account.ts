"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpace } from "@/lib/data/space";

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Please sign in again." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false as const,
      error:
        "Account deletion isn't configured yet. Add SUPABASE_SECRET_KEY on the server.",
    };
  }

  const { connection } = await getActiveSpace(user.id);
  if (connection) {
    await supabase.rpc("end_connection", { p_connection_id: connection.id });
  }

  const { data: entries } = await supabase
    .from("daily_entries")
    .select("photo_path")
    .eq("user_id", user.id);
  const photos = (entries ?? [])
    .map((row) => row.photo_path)
    .filter((path): path is string => Boolean(path));
  if (photos.length) {
    await admin.storage.from("daily-photos").remove(photos);
  }

  const { data: drops } = await supabase
    .from("voice_drops")
    .select("storage_path")
    .eq("sender_id", user.id);
  const voices = (drops ?? []).map((row) => row.storage_path);
  if (voices.length) {
    await admin.storage.from("voice-drops").remove(voices);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.avatar_path) {
    await admin.storage.from("avatars").remove([profile.avatar_path]);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return {
      ok: false as const,
      error: "Couldn't delete the account just then. Try once more.",
    };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
