import type { Me } from "./types";

let clockSkewMs = 0;

/** Remember the offset between the server's (possibly time-travelled) clock and ours. */
export function syncServerClock(serverNowIso: string) {
  clockSkewMs = Date.parse(serverNowIso) - Date.now();
}

export function serverNow(): number {
  return Date.now() + clockSkewMs;
}

/** Time until the next heart, measured on the server's clock. */
export function heartCountdown(me: Me): string {
  if (!me.next_heart_at) return "";
  const ms = Date.parse(me.next_heart_at) - serverNow();
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function weekdayLetter(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return ["Su", "M", "Tu", "W", "Th", "F", "Sa"][d.getDay()];
}

export function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
