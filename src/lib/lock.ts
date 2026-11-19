import type { Prisma } from "@/generated/prisma/client";

// Identifiants des lignes de `app_lock` (insérées par la migration initiale).
export const LOCK_BOOKINGS = 1;
export const LOCK_REGISTRATIONS = 2;

// READ COMMITTED : après le verrou, les lectures voient tout ce qui a été validé avant lui (REPEATABLE READ par défaut).
export const LOCKED_TRANSACTION = { isolationLevel: "ReadCommitted" } as const;

/**
 * Verrou tenu jusqu'à la fin de la transaction : sérialise une section critique (MySQL n'a pas
 * d'équivalent de `pg_advisory_xact_lock`). La ligne doit exister, sinon rien n'est verrouillé.
 */
export async function lockRow(tx: Prisma.TransactionClient, id: number) {
  const rows = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM app_lock WHERE id = ${id} FOR UPDATE`;
  if (rows.length === 0) throw new Error(`Verrou ${id} introuvable : la migration initiale n'a pas été appliquée.`);
}
