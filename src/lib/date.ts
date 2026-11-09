// Les instants sont stockés en UTC ; les jours, horaires de travail et affichages sont ceux de Paris.
export const TIME_ZONE = "Europe/Paris";

/** Jour calendaire de Paris au format `YYYY-MM-DD`. */
export type DateKey = string;

const MINUTE_MS = 60_000;
const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const wallClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function wallClockParts(ms: number) {
  const parts: Record<string, number> = {};
  for (const part of wallClock.formatToParts(ms)) if (part.type !== "literal") parts[part.type] = Number(part.value);
  return parts as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
}

// Décalage de Paris par rapport à UTC (en ms) à l'instant donné.
function offsetAt(ms: number) {
  const whole = Math.floor(ms / 1000) * 1000;
  const p = wallClockParts(whole);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole;
}

export function parseDateKey(value: string): { year: number; month: number; day: number } | null {
  const match = DATE_KEY.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  const valid = check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
  return valid ? { year, month, day } : null;
}

export const isDateKey = (value: string) => parseDateKey(value) !== null;

function requireDateKey(value: DateKey) {
  const parsed = parseDateKey(value);
  if (!parsed) throw new RangeError(`Date invalide : ${value}`);
  return parsed;
}

/** Jour de Paris contenant cet instant. */
export function dateKeyOf(instant: Date): DateKey {
  const p = wallClockParts(instant.getTime());
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Heure de Paris de cet instant au format `HH:MM`. */
export function timeKeyOf(instant: Date): string {
  const p = wallClockParts(instant.getTime());
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export function addDays(key: DateKey, days: number): DateKey {
  const { year, month, day } = requireDateKey(key);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Jour de la semaine ISO : 1 = lundi … 7 = dimanche. */
export function isoWeekday(key: DateKey) {
  const { year, month, day } = requireDateKey(key);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() || 7;
}

/** Instant UTC correspondant à `minutes` minutes après minuit, heure de Paris, le jour `key`. */
export function parisToUtc(key: DateKey, minutes: number): Date {
  const { year, month, day } = requireDateKey(key);
  const wall = Date.UTC(year, month - 1, day, 0, minutes);
  // Deux passes : le décalage de l'instant cherché peut différer de celui de l'instant « mural » (changement d'heure).
  const guess = wall - offsetAt(wall);
  return new Date(wall - offsetAt(guess));
}

/** Premier jour du mois et dernier jour du mois (`YYYY-MM`). */
export function monthBounds(month: string): { from: DateKey; to: DateKey } | null {
  const first = parseDateKey(`${month}-01`);
  if (!first) return null;
  const from = `${month}-01`;
  const lastDay = new Date(Date.UTC(first.year, first.month, 0)).getUTCDate();
  return { from, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

/** Mois (`YYYY-MM`) décalé de `delta` mois. */
export function shiftMonth(month: string, delta: number): string {
  const first = parseDateKey(`${month}-01`);
  if (!first) throw new RangeError(`Mois invalide : ${month}`);
  return new Date(Date.UTC(first.year, first.month - 1 + delta, 1)).toISOString().slice(0, 7);
}

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });

export const formatDay = (instant: Date | string) => dayFormat.format(new Date(instant));
export const formatTime = (instant: Date | string) => timeFormat.format(new Date(instant)).replace(":", " h ");
export const formatDateTime = (instant: Date | string) => `${formatDay(instant)} à ${formatTime(instant)}`;

export const minutesToMs = (minutes: number) => minutes * MINUTE_MS;
