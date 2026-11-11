import { db } from "@/lib/db";
import { RETENTION_KEY, resolveRetentionMonths } from "@/modules/privacy/retention";

// Adresse qui reçoit les notifications de l'administrateur (nouvelle réservation, annulation) : envoi à l'étape 5.
export const ADMIN_EMAIL_KEY = "notifications.admin_email";

export async function getAdminNotificationEmail() {
  const row = await db.setting.findUnique({ where: { key: ADMIN_EMAIL_KEY } });
  return typeof row?.value === "string" ? row.value : "";
}

export async function getRetentionMonths() {
  const row = await db.setting.findUnique({ where: { key: RETENTION_KEY } });
  return resolveRetentionMonths(row?.value);
}
