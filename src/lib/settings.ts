import { db } from "@/lib/db";

// Adresse qui reçoit les notifications de l'administrateur (nouvelle réservation, annulation) : envoi à l'étape 5.
export const ADMIN_EMAIL_KEY = "notifications.admin_email";

export async function getAdminNotificationEmail() {
  const row = await db.setting.findUnique({ where: { key: ADMIN_EMAIL_KEY } });
  return typeof row?.value === "string" ? row.value : "";
}
