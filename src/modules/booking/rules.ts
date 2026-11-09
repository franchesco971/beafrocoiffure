import { z } from "zod";

export type BookingRules = {
  /** Pause entre deux prestations (minutes), incluse dans le bloc occupé. */
  bufferMinutes: number;
  /** Délai minimum entre maintenant et le début du rendez-vous (heures). */
  minNoticeHours: number;
  /** Pas des créneaux proposés (minutes). */
  slotStepMinutes: number;
  /** Délai limite pour annuler ou demander une modification (heures avant le rendez-vous). */
  cancelLimitHours: number;
  /** Horizon de réservation (jours à partir d'aujourd'hui). */
  maxAdvanceDays: number;
};

export const DEFAULT_RULES: BookingRules = {
  bufferMinutes: 15,
  minNoticeHours: 24,
  slotStepMinutes: 30,
  cancelLimitHours: 48,
  maxAdvanceDays: 90,
};

// Clés de la table `setting` (document technique §6.5).
export const RULE_KEYS = {
  bufferMinutes: "booking.buffer_minutes",
  minNoticeHours: "booking.min_notice_hours",
  slotStepMinutes: "booking.slot_step_minutes",
  cancelLimitHours: "booking.cancel_limit_hours",
  maxAdvanceDays: "booking.max_advance_days",
} as const satisfies Record<keyof BookingRules, string>;

const RULE_SCHEMAS = {
  bufferMinutes: z.number().int().min(0).max(240),
  minNoticeHours: z.number().int().min(0).max(720),
  slotStepMinutes: z.number().int().min(5).max(240),
  cancelLimitHours: z.number().int().min(0).max(720),
  maxAdvanceDays: z.number().int().min(1).max(365),
} as const satisfies Record<keyof BookingRules, z.ZodType<number>>;

/** Règles effectives : valeur enregistrée si elle est valide, sinon valeur par défaut. */
export function resolveRules(rows: { key: string; value: unknown }[]): BookingRules {
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const rules = { ...DEFAULT_RULES };
  for (const name of Object.keys(RULE_KEYS) as (keyof BookingRules)[]) {
    const parsed = RULE_SCHEMAS[name].safeParse(stored.get(RULE_KEYS[name]));
    if (parsed.success) rules[name] = parsed.data;
  }
  return rules;
}
