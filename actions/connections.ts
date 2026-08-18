"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inviteTokenSchema } from "@/lib/validation/schemas";

export async function createInvite() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Please sign in again." };
  }

  const { data, error } = await supabase.rpc("create_connection_invite");
  const invite = Array.isArray(data) ? data[0] : data;
  if (error || !invite) {
    return {
      ok: false as const,
      error: error?.message?.includes("active space")
        ? "You already have an active space."
        : "Couldn't create that invite. Try once more.",
    };
  }
  revalidatePath("/onboarding");
  revalidatePath("/invite");
  return { ok: true as const, invite };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_connection_invite", {
    p_invite_id: inviteId,
  });
  if (error) {
    return { ok: false as const, error: "Couldn't revoke that invite." };
  }
  revalidatePath("/invite");
  return { ok: true as const };
}

export async function acceptInvite(token: string) {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success) {
    return { ok: false as const, error: "That invite link doesn't look right." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Please sign in to join." };
  }

  const { data, error } = await supabase.rpc("accept_connection_invite", {
    invite_token: parsed.data,
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("own invite")) {
      return { ok: false as const, error: "That's your own invite." };
    }
    if (message.includes("expired")) {
      return { ok: false as const, error: "This invite has expired." };
    }
    if (message.includes("already used")) {
      return { ok: false as const, error: "This invite was already used." };
    }
    if (message.includes("no longer valid")) {
      return { ok: false as const, error: "This invite is no longer valid." };
    }
    if (message.includes("active space")) {
      return {
        ok: false as const,
        error: "One of you already has an active space.",
      };
    }
    return { ok: false as const, error: "Couldn't join that space. Try once more." };
  }
  revalidatePath("/", "layout");
  return { ok: true as const, connectionId: data };
}

export async function endConnection(connectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_connection", {
    p_connection_id: connectionId,
  });
  if (error) {
    return { ok: false as const, error: "Couldn't disconnect just then. Try once more." };
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}
