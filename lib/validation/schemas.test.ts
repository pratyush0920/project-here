import { describe, expect, it } from "vitest";
import {
  dailyEntryInputSchema,
  httpsUrlSchema,
  isDailyEntryEmpty,
  reactionSchema,
  voiceDurationSchema,
} from "@/lib/validation/schemas";
import { CUSTOM_STATUS_MAX, NOTE_MAX } from "@/lib/constants";
import {
  isInviteExpired,
  localDateInTimeZone,
  monthBounds,
  shiftMonth,
} from "@/lib/dates/timezone";
import { identifySongProvider } from "@/lib/media/helpers";
import { safeNextPath } from "@/lib/env";

describe("daily entry validation", () => {
  it("rejects notes over 180 characters", () => {
    const result = dailyEntryInputSchema.safeParse({
      note: "x".repeat(NOTE_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a 180 character note", () => {
    const result = dailyEntryInputSchema.safeParse({
      note: "x".repeat(NOTE_MAX),
    });
    expect(result.success).toBe(true);
  });

  it("rejects custom status over 30 characters", () => {
    const result = dailyEntryInputSchema.safeParse({
      presenceStatus: "custom",
      customStatus: "x".repeat(CUSTOM_STATUS_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it("requires custom text when status is custom", () => {
    const result = dailyEntryInputSchema.safeParse({
      presenceStatus: "custom",
      customStatus: "  ",
    });
    expect(result.success).toBe(false);
  });

  it("treats empty canvas as empty", () => {
    expect(isDailyEntryEmpty({})).toBe(true);
  });
});

describe("reactions", () => {
  it("accepts the allowed set", () => {
    expect(reactionSchema.parse("seen")).toBe("seen");
    expect(reactionSchema.parse("heart")).toBe("heart");
  });
  it("rejects unknown reactions", () => {
    expect(reactionSchema.safeParse("fire").success).toBe(false);
  });
});

describe("voice duration", () => {
  it("allows up to 30 seconds", () => {
    expect(voiceDurationSchema.parse(30)).toBe(30);
    expect(voiceDurationSchema.safeParse(30.1).success).toBe(false);
    expect(voiceDurationSchema.safeParse(0).success).toBe(false);
  });
});

describe("urls", () => {
  it("requires https", () => {
    expect(httpsUrlSchema.safeParse("https://open.spotify.com/track/1").success).toBe(
      true,
    );
    expect(httpsUrlSchema.safeParse("http://example.com").success).toBe(false);
    expect(httpsUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("timezones", () => {
  it("computes the India calendar date independently of UTC", () => {
    const utcEvening = new Date("2026-08-17T20:30:00.000Z");
    expect(localDateInTimeZone("Asia/Kolkata", utcEvening)).toBe("2026-08-18");
    expect(localDateInTimeZone("UTC", utcEvening)).toBe("2026-08-17");
  });

  it("does not shift a local date across a timezone boundary", () => {
    const dubaiMorning = new Date("2026-08-18T01:00:00.000Z");
    expect(localDateInTimeZone("Asia/Dubai", dubaiMorning)).toBe("2026-08-18");
  });

  it("returns month bounds in calendar space", () => {
    expect(monthBounds(2026, 2)).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("detects invite expiry", () => {
    expect(isInviteExpired("2020-01-01T00:00:00.000Z", new Date("2026-01-01"))).toBe(
      true,
    );
    expect(isInviteExpired("2099-01-01T00:00:00.000Z", new Date("2026-01-01"))).toBe(
      false,
    );
  });
});

describe("song providers", () => {
  it("recognises providers from the URL host", () => {
    expect(identifySongProvider("https://open.spotify.com/track/abc")).toBe("spotify");
    expect(identifySongProvider("https://music.apple.com/us/album/x")).toBe("apple");
    expect(identifySongProvider("https://music.youtube.com/watch?v=1")).toBe("youtube");
    expect(identifySongProvider("https://example.com/song")).toBe("other");
  });
});

describe("safe redirects", () => {
  it("only allows internal paths", () => {
    expect(safeNextPath("/app/today")).toBe("/app/today");
    expect(safeNextPath("https://evil.example")).toBe("/app/today");
    expect(safeNextPath("//evil.example")).toBe("/app/today");
  });
});
