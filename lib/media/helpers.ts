export type SongProvider = "spotify" | "apple" | "youtube" | "other";

export function identifySongProvider(url: string): SongProvider {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "open.spotify.com" || host === "spotify.link") return "spotify";
    if (host === "music.apple.com" || host === "itunes.apple.com") return "apple";
    if (
      host === "music.youtube.com" ||
      host === "youtube.com" ||
      host === "youtu.be"
    ) {
      return "youtube";
    }
    return "other";
  } catch {
    return "other";
  }
}

export function songProviderLabel(provider: SongProvider): string {
  switch (provider) {
    case "spotify":
      return "Spotify";
    case "apple":
      return "Apple Music";
    case "youtube":
      return "YouTube Music";
    default:
      return "Listen";
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function extensionForMime(mime: string): string {
  const base = mime.split(";")[0]?.trim() ?? "audio/webm";
  if (base === "audio/mp4" || base === "audio/m4a") return "m4a";
  if (base === "audio/mpeg") return "mp3";
  if (base === "audio/ogg") return "ogg";
  if (base === "audio/wav") return "wav";
  return "webm";
}

export function pickRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}
