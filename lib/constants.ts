export const NOTE_MAX = 180;
export const CUSTOM_STATUS_MAX = 30;
export const DISPLAY_NAME_MAX = 50;
export const DISPLAY_NAME_MIN = 1;
export const VOICE_MAX_SECONDS = 30;
export const PHOTO_MAX_ORIGINAL_BYTES = 8 * 1024 * 1024;
export const PHOTO_MAX_EDGE = 1600;
export const INVITE_TTL_DAYS = 7;
export const APP_CONTENT_MAX_WIDTH = 560;

export const PRESENCE_STATUSES = [
  "working",
  "commuting",
  "home",
  "exploring",
  "need_company",
  "taking_it_slow",
  "offline",
  "custom",
] as const;

export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export const MOODS = [
  "good",
  "calm",
  "excited",
  "tired",
  "overwhelmed",
  "low",
  "neutral",
] as const;

export type Mood = (typeof MOODS)[number];

export const REACTIONS = ["seen", "laugh", "here", "heart"] as const;
export type ReactionType = (typeof REACTIONS)[number];

export const PRESENCE_COPY: Record<
  Exclude<PresenceStatus, "custom">,
  { label: string; hint: string }
> = {
  working: { label: "Working", hint: "In it." },
  commuting: { label: "Commuting", hint: "Between places." },
  home: { label: "Home", hint: "Around the usual rooms." },
  exploring: { label: "Exploring", hint: "Out in the world." },
  need_company: { label: "Need company", hint: "Could use a little closeness." },
  taking_it_slow: { label: "Taking it slow", hint: "Unhurried." },
  offline: { label: "Offline", hint: "Stepping back for a bit." },
};

export const MOOD_COPY: Record<Mood, string> = {
  good: "Good",
  calm: "Calm",
  excited: "Excited",
  tired: "Tired",
  overwhelmed: "Overwhelmed",
  low: "Low",
  neutral: "Neutral",
};

export const REACTION_COPY: Record<
  ReactionType,
  { label: string; glyph: string }
> = {
  seen: { label: "Seen", glyph: "👀" },
  laugh: { label: "Laugh", glyph: "😂" },
  here: { label: "Here", glyph: "🫂" },
  heart: { label: "Warm", glyph: "💛" },
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const COPY = {
  saveError: "Couldn't save that. Your update is still here, so try once more.",
  photoError: "That photo didn't make it through. Try another one.",
  voiceError: "That voice drop didn't make it through. Try once more.",
  emptyPartner: "Nothing here yet.",
  emptyPartnerHint:
    "No need to nudge them. Their day will appear when they feel like sharing it.",
  quietDay: "Some days are quiet.",
  noMemories: "Your ordinary days will collect here.",
  noConnection: "Here is better with one person.",
  noConnectionHint: "Invite someone you want to keep a little closer.",
  saved: "Saved here.",
  voiceSent: "Voice drop sent.",
  disconnectBody:
    "You will stop seeing each other's private updates. Your own content remains yours.",
};
