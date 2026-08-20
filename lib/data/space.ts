import { createClient } from "@/lib/supabase/server";
import { partnerId } from "@/lib/connections/helpers";
import type { Connection, Profile } from "@/types/database";

export async function getUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, user: null, profile: null };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, profile: profile as Profile | null };
}

export async function getActiveSpace(userId: string) {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .eq("status", "active")
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
    .maybeSingle();

  if (!connection) {
    return { supabase, connection: null, partner: null as Profile | null };
  }

  const otherId = partnerId(connection as Connection, userId);
  const { data: partner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", otherId)
    .maybeSingle();

  return {
    supabase,
    connection: connection as Connection,
    partner: partner as Profile | null,
  };
}

export async function signedUrl(
  bucket: "daily-photos" | "voice-drops" | "avatars",
  path: string | null,
  expires = 60 * 60,
): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expires);
  if (error) return null;
  return data.signedUrl;
}
