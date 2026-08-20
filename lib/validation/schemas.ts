import { z } from "zod";
import {
  CUSTOM_STATUS_MAX,
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  MOODS,
  NOTE_MAX,
  PRESENCE_STATUSES,
  REACTIONS,
  VOICE_MAX_SECONDS,
} from "@/lib/constants";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim())
    .pipe(z.string().max(max))
    .nullable()
    .optional()
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    });

export const timezoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((value) => isValidTimeZone(value), "Choose a valid timezone.");

export function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN, "A name helps your person recognise you.")
  .max(DISPLAY_NAME_MAX);

export const profileSchema = z.object({
  displayName: displayNameSchema,
  timezone: timezoneSchema,
});

export const presenceStatusSchema = z.enum(PRESENCE_STATUSES);
export const moodSchema = z.enum(MOODS);
export const reactionSchema = z.enum(REACTIONS);

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a full https link.");

export const songSchema = z
  .object({
    url: z.string().optional().nullable(),
    title: z.string().max(120).optional().nullable(),
    artist: z.string().max(120).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const url = value.url?.trim() ?? "";
    if (!url) return;
    if (!httpsUrlSchema.safeParse(url).success) {
      ctx.addIssue({
        code: "custom",
        message: "Use a full https link.",
        path: ["url"],
      });
    }
  });

export const dailyEntryInputSchema = z
  .object({
    presenceStatus: presenceStatusSchema.nullable().optional(),
    customStatus: z.string().max(CUSTOM_STATUS_MAX).nullable().optional(),
    mood: moodSchema.nullable().optional(),
    note: z.string().max(NOTE_MAX).nullable().optional(),
    songUrl: z.string().max(2000).nullable().optional(),
    songTitle: z.string().max(120).nullable().optional(),
    songArtist: z.string().max(120).nullable().optional(),
    photoPath: z.string().max(500).nullable().optional(),
    removePhoto: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const presence = value.presenceStatus ?? null;
    const custom = value.customStatus?.trim() ?? "";
    if (presence === "custom") {
      if (!custom) {
        ctx.addIssue({
          code: "custom",
          message: "Write a short custom status, or pick another one.",
          path: ["customStatus"],
        });
      } else if (custom.length > CUSTOM_STATUS_MAX) {
        ctx.addIssue({
          code: "custom",
          message: `Keep it under ${CUSTOM_STATUS_MAX} characters.`,
          path: ["customStatus"],
        });
      }
    }
    const songUrl = value.songUrl?.trim() ?? "";
    if (songUrl && !httpsUrlSchema.safeParse(songUrl).success) {
      ctx.addIssue({
        code: "custom",
        message: "Use a full https link.",
        path: ["songUrl"],
      });
    }
  });

export type DailyEntryInput = z.infer<typeof dailyEntryInputSchema>;

export function isDailyEntryEmpty(input: DailyEntryInput): boolean {
  const note = input.note?.trim() ?? "";
  const song = input.songUrl?.trim() ?? "";
  const custom = input.customStatus?.trim() ?? "";
  return (
    !input.presenceStatus &&
    !custom &&
    !input.mood &&
    !note &&
    !song &&
    !input.photoPath &&
    !input.removePhoto
  );
}

export const voiceDurationSchema = z
  .number()
  .positive()
  .max(VOICE_MAX_SECONDS);

export const emailSchema = z.email("Use a valid email address.");

export const inviteTokenSchema = z.uuid();

export { optionalTrimmed };
