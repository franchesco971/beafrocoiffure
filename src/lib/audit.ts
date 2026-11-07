import { db } from "@/lib/db";

export type AuditAction = "LOGIN" | "LOGIN_FAILED" | "LOGOUT" | (string & {});

/** Trace une action d'administration dans `audit_log` ; `adminId` est nul pour une tentative sur un compte inconnu. */
export async function audit(adminId: number | null, action: AuditAction, entity: string, entityId?: string | number) {
  await db.auditLog.create({
    data: { adminId, action, entity, entityId: entityId === undefined ? null : String(entityId) },
  });
}
