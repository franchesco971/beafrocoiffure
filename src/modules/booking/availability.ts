import { addDays, dateKeyOf, minutesToMs, parisToUtc, type DateKey } from "@/lib/date";
import type { BookingRules } from "./rules";

export type Interval = { start: Date; end: Date };
/** Plage de travail d'un jour, en minutes après minuit (heure de Paris). */
export type WorkWindow = { startMin: number; endMin: number };

export type SlotQuery = {
  date: DateKey;
  /** Somme des durées des prestations choisies. */
  durationMin: number;
  rules: BookingRules;
  windows: WorkWindow[];
  /** Congés, blocages et rendez-vous actifs (`PENDING`, `CONFIRMED`). */
  busy: Interval[];
  now: Date;
};

/** Bloc occupé : durée totale + pause entre prestations (document technique §6.1). */
export const blockMinutes = (durationMin: number, rules: BookingRules) => durationMin + rules.bufferMinutes;

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/**
 * Débuts de rendez-vous possibles pour un jour (document technique §6.2).
 * La prestation doit tenir dans une plage de travail ; la pause qui suit peut la dépasser mais ne doit
 * chevaucher ni rendez-vous ni congé.
 */
export function computeSlots({ date, durationMin, rules, windows, busy, now }: SlotQuery): Date[] {
  const today = dateKeyOf(now);
  if (date < today || date > addDays(today, rules.maxAdvanceDays)) return [];

  const earliest = now.getTime() + rules.minNoticeHours * 3_600_000;
  const blockMs = minutesToMs(blockMinutes(durationMin, rules));
  const starts = new Map<number, Date>();

  for (const window of windows) {
    for (let minute = window.startMin; minute + durationMin <= window.endMin; minute += rules.slotStepMinutes) {
      const start = parisToUtc(date, minute);
      if (start.getTime() < earliest) continue;
      const block = { start, end: new Date(start.getTime() + blockMs) };
      if (busy.some((interval) => overlaps(block, interval))) continue;
      starts.set(start.getTime(), start);
    }
  }

  return [...starts.values()].sort((a, b) => a.getTime() - b.getTime());
}

export const isSlotAvailable = (query: SlotQuery, startsAt: Date) =>
  computeSlots(query).some((slot) => slot.getTime() === startsAt.getTime());
