"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fieldErrors, readText, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin, requireRole } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { ADMIN_EMAIL_KEY } from "@/lib/settings";
import { RULE_KEYS, RULE_LIMITS, type BookingRules } from "@/modules/booking/rules";
import { purgeExpiredData } from "@/modules/privacy/privacy.service";
import { RETENTION_KEY, RETENTION_LIMITS } from "@/modules/privacy/retention";

const rule = ({ min, max }: { min: number; max: number }) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, "Nombre entier requis.")
    .transform(Number)
    .pipe(z.number().min(min, `${min} minimum.`).max(max, `${max} maximum.`));

const rulesSchema = z.object({
  bufferMinutes: rule(RULE_LIMITS.bufferMinutes),
  minNoticeHours: rule(RULE_LIMITS.minNoticeHours),
  slotStepMinutes: rule(RULE_LIMITS.slotStepMinutes),
  cancelLimitHours: rule(RULE_LIMITS.cancelLimitHours),
  maxAdvanceDays: rule(RULE_LIMITS.maxAdvanceDays),
});

const RULE_NAMES = Object.keys(RULE_KEYS) as (keyof BookingRules)[];

export async function saveBookingRules(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values = Object.fromEntries(RULE_NAMES.map((name) => [name, readText(formData, name)]));
  const parsed = rulesSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  await db.$transaction(
    RULE_NAMES.map((name) =>
      db.setting.upsert({
        where: { key: RULE_KEYS[name] },
        update: { value: parsed.data[name] },
        create: { key: RULE_KEYS[name], value: parsed.data[name] },
      }),
    ),
  );
  await audit(admin.id, "SETTINGS_BOOKING_RULES", "setting");
  return { saved: true, values };
}

const emailSchema = z.object({
  adminEmail: z.union([z.literal(""), z.email("Adresse e-mail invalide.").max(254, "254 caractères maximum.")]),
});

export async function saveAdminEmail(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values = { adminEmail: readText(formData, "adminEmail") };
  const parsed = emailSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const value = parsed.data.adminEmail.toLowerCase();
  await db.setting.upsert({
    where: { key: ADMIN_EMAIL_KEY },
    update: { value },
    create: { key: ADMIN_EMAIL_KEY, value },
  });
  await audit(admin.id, "SETTINGS_ADMIN_EMAIL", "setting", ADMIN_EMAIL_KEY);
  return { saved: true, values: { adminEmail: value } };
}

const retentionSchema = z.object({ retentionMonths: rule(RETENTION_LIMITS) });

export async function saveRetention(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values = { retentionMonths: readText(formData, "retentionMonths") };
  const parsed = retentionSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const value = parsed.data.retentionMonths;
  await db.setting.upsert({
    where: { key: RETENTION_KEY },
    update: { value },
    create: { key: RETENTION_KEY, value },
  });
  await audit(admin.id, "SETTINGS_RETENTION", "setting", RETENTION_KEY);
  revalidatePath("/admin/parametres");
  return { saved: true, values };
}

export async function runRetentionPurge(): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const { clients, messages, registrations } = await purgeExpiredData(new Date(), admin.id);
  revalidatePath("/admin/parametres");
  return {
    saved: true,
    message: `${clients} fiche(s) anonymisée(s), ${messages} message(s) supprimé(s), ${registrations} inscription(s) anonymisée(s).`,
  };
}

const MAX_PASSWORD_LENGTH = 256;

// Échecs seulement : 5 par compte sur 15 minutes.
const failures = createRateLimiter({ name: "password-change", limit: 5, windowMs: 15 * 60_000 });

export async function changePassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const { id } = await requireAdmin();

  const current = readText(formData, "currentPassword");
  const next = readText(formData, "newPassword");
  const confirm = readText(formData, "confirmPassword");

  const errors: Record<string, string[]> = {};
  if (next.length < 12) errors.newPassword = ["12 caractères minimum."];
  else if (next.length > MAX_PASSWORD_LENGTH) errors.newPassword = [`${MAX_PASSWORD_LENGTH} caractères maximum.`];
  else if (next === current) errors.newPassword = ["Choisissez un mot de passe différent de l'actuel."];
  if (confirm !== next) errors.confirmPassword = ["Les deux mots de passe ne correspondent pas."];
  if (current.length === 0 || current.length > MAX_PASSWORD_LENGTH)
    errors.currentPassword = ["Mot de passe actuel requis."];
  if (Object.keys(errors).length > 0) return { errors };

  const key = String(id);
  if (failures.retryAfter(key)) return { message: "Trop de tentatives. Réessayez dans quelques minutes." };

  const account = await db.adminUser.findUnique({ where: { id }, select: { passwordHash: true } });
  if (!(await verifyPassword(account?.passwordHash, current))) {
    failures.hit(key);
    await audit(id, "PASSWORD_CHANGE_FAILED", "admin_user", id);
    return { errors: { currentPassword: ["Mot de passe actuel incorrect."] } };
  }

  failures.reset(key);
  await db.adminUser.update({ where: { id }, data: { passwordHash: await hashPassword(next) } });
  await audit(id, "PASSWORD_CHANGE", "admin_user", id);
  return { saved: true };
}
