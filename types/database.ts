export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PresenceStatus =
  | "working"
  | "commuting"
  | "home"
  | "exploring"
  | "need_company"
  | "taking_it_slow"
  | "offline"
  | "custom";

export type Mood =
  | "good"
  | "calm"
  | "excited"
  | "tired"
  | "overwhelmed"
  | "low"
  | "neutral";

export type ReactionKind = "seen" | "laugh" | "here" | "heart";

export type ConnectionStatus = "active" | "ended";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_path: string | null;
          timezone: string;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_path?: string | null;
          timezone?: string;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_path?: string | null;
          timezone?: string;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          user_one_id: string;
          user_two_id: string;
          created_by: string;
          created_at: string;
          ended_at: string | null;
          ended_by: string | null;
          status: ConnectionStatus;
        };
        Insert: {
          id?: string;
          user_one_id: string;
          user_two_id: string;
          created_by: string;
          created_at?: string;
          ended_at?: string | null;
          ended_by?: string | null;
          status?: ConnectionStatus;
        };
        Update: {
          ended_at?: string | null;
          ended_by?: string | null;
          status?: ConnectionStatus;
        };
        Relationships: [];
      };
      connection_invites: {
        Row: {
          id: string;
          creator_id: string;
          token: string;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          token?: string;
          created_at?: string;
          expires_at: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      daily_entries: {
        Row: {
          id: string;
          connection_id: string;
          user_id: string;
          local_date: string;
          timezone_snapshot: string;
          presence_status: PresenceStatus | null;
          custom_status: string | null;
          mood: Mood | null;
          note: string | null;
          photo_path: string | null;
          song_url: string | null;
          song_title: string | null;
          song_artist: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          user_id: string;
          local_date: string;
          timezone_snapshot: string;
          presence_status?: PresenceStatus | null;
          custom_status?: string | null;
          mood?: Mood | null;
          note?: string | null;
          photo_path?: string | null;
          song_url?: string | null;
          song_title?: string | null;
          song_artist?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          timezone_snapshot?: string;
          presence_status?: PresenceStatus | null;
          custom_status?: string | null;
          mood?: Mood | null;
          note?: string | null;
          photo_path?: string | null;
          song_url?: string | null;
          song_title?: string | null;
          song_artist?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      voice_drops: {
        Row: {
          id: string;
          connection_id: string;
          sender_id: string;
          storage_path: string;
          mime_type: string;
          duration_seconds: number;
          local_date: string;
          timezone_snapshot: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          sender_id: string;
          storage_path: string;
          mime_type: string;
          duration_seconds: number;
          local_date: string;
          timezone_snapshot: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["voice_drops"]["Insert"]>;
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          sender_id: string;
          daily_entry_id: string | null;
          voice_drop_id: string | null;
          reaction: ReactionKind;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          daily_entry_id?: string | null;
          voice_drop_id?: string | null;
          reaction: ReactionKind;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          reaction?: ReactionKind;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_connection_invite: {
        Args: Record<string, never>;
        Returns: { id: string; token: string; expires_at: string }[];
      };
      accept_connection_invite: {
        Args: { invite_token: string };
        Returns: string;
      };
      end_connection: {
        Args: { p_connection_id: string };
        Returns: undefined;
      };
      get_invite_preview: {
        Args: { invite_token: string };
        Returns: {
          display_name: string;
          avatar_path: string | null;
          expires_at: string;
        }[];
      };
      revoke_connection_invite: {
        Args: { p_invite_id: string };
        Returns: undefined;
      };
      is_active_connection_member: {
        Args: { p_connection_id: string };
        Returns: boolean;
      };
      active_partner_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];
export type VoiceDrop = Database["public"]["Tables"]["voice_drops"]["Row"];
export type Reaction = Database["public"]["Tables"]["reactions"]["Row"];
export type ConnectionInvite =
  Database["public"]["Tables"]["connection_invites"]["Row"];
