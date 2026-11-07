type Entry = { count: number; resetAt: number };

// Compteurs en mémoire (une seule instance de l'application) ; partagés entre rechargements à chaud.
const globalForLimits = globalThis as unknown as { rateLimitBuckets?: Map<string, Entry> };
const buckets = (globalForLimits.rateLimitBuckets ??= new Map<string, Entry>());

const PURGE_THRESHOLD = 5_000;

function purgeExpired(now: number) {
  for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key);
}

// Fenêtre fixe : au-delà de `limit` événements dans `windowMs`, la clé est bloquée jusqu'à la fin de la fenêtre.
export function createRateLimiter({ name, limit, windowMs }: { name: string; limit: number; windowMs: number }) {
  const bucketKey = (key: string) => `${name}:${key}`;

  return {
    /** Millisecondes restantes avant déblocage, 0 si la clé est autorisée. */
    retryAfter(key: string) {
      const now = Date.now();
      const entry = buckets.get(bucketKey(key));
      return entry && entry.resetAt > now && entry.count >= limit ? entry.resetAt - now : 0;
    },
    hit(key: string) {
      const now = Date.now();
      if (buckets.size > PURGE_THRESHOLD) purgeExpired(now);
      const entry = buckets.get(bucketKey(key));
      if (!entry || entry.resetAt <= now) buckets.set(bucketKey(key), { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
    },
    reset(key: string) {
      buckets.delete(bucketKey(key));
    },
  };
}
