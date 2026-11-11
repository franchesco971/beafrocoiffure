// Durée de conservation des données personnelles (en mois), réglable depuis l'administration.
export const RETENTION_KEY = "privacy.retention_months";
export const RETENTION_LIMITS = { min: 6, max: 120 } as const;
export const DEFAULT_RETENTION_MONTHS = 36;

/** Valeur enregistrée si elle est valide, sinon la durée par défaut. */
export function resolveRetentionMonths(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= RETENTION_LIMITS.min &&
    value <= RETENTION_LIMITS.max
    ? value
    : DEFAULT_RETENTION_MONTHS;
}

/** Date avant laquelle une donnée inactive a dépassé sa durée de conservation. */
export function retentionCutoff(now: Date, months: number) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  return cutoff;
}
