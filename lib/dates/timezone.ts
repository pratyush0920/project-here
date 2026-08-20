const DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = DATE_FORMATTER_CACHE.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  DATE_FORMATTER_CACHE.set(timeZone, formatter);
  return formatter;
}

/** YYYY-MM-DD in the named IANA timezone. Never uses the server's local zone. */
export function localDateInTimeZone(
  timeZone: string,
  instant: Date = new Date(),
): string {
  return dateFormatter(timeZone).format(instant);
}

export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error("Invalid date");
  }
  return { year, month, day };
}

export function addDaysIso(iso: string, days: number): string {
  const { year, month, day } = parseIsoDate(iso);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthBounds(year: number, month: number): {
  start: string;
  end: string;
} {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;
  return { start, end };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function formatLongDate(
  isoDate: string,
  timeZone: string,
  locale = "en-GB",
): string {
  const { year, month, day } = parseIsoDate(isoDate);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(utcNoon);
}

export function formatHeaderDate(timeZone: string, instant = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(instant);
}

export function formatClock(
  instant: Date | string,
  viewerTimeZone: string,
): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: viewerTimeZone,
  }).format(date);
}

export function formatMonthHeading(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  const name = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(date);
  const now = new Date();
  if (year === now.getUTCFullYear()) {
    return name;
  }
  return `${name} ${year}`;
}

export function timezoneLabel(timeZone: string): string {
  return timeZone.replace(/_/g, " ");
}

export function isInviteExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function listTimeZones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return ["UTC"];
}
