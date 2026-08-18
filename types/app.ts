import type { DailyEntry, Profile, Reaction, VoiceDrop } from "@/types/database";

export type ReactionWithSender = Reaction & {
  sender?: Pick<Profile, "id" | "display_name"> | null;
};

export type DailyEntryView = DailyEntry & {
  reactions: Reaction[];
  photoUrl?: string | null;
  author: Pick<Profile, "id" | "display_name" | "avatar_path" | "timezone">;
};

export type VoiceDropView = VoiceDrop & {
  reactions: Reaction[];
  audioUrl?: string | null;
  sender: Pick<Profile, "id" | "display_name" | "avatar_path">;
};
