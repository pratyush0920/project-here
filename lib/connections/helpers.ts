import type { Connection, Profile } from "@/types/database";

export function partnerId(connection: Connection, userId: string): string {
  return connection.user_one_id === userId
    ? connection.user_two_id
    : connection.user_one_id;
}

export function isConnectionMember(
  connection: Connection,
  userId: string,
): boolean {
  return (
    connection.user_one_id === userId || connection.user_two_id === userId
  );
}

export type SpaceSnapshot = {
  connection: Connection;
  me: Profile;
  partner: Profile;
};

export function profileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return (
    profile.display_name.trim().length > 0 &&
    Boolean(profile.onboarding_completed_at)
  );
}
