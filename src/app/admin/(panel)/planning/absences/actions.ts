"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { dateField, fieldErrors, parisInstant, readFlag, readText, timeField, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guard";
import { addDays, parisToUtc } from "@/lib/date";
import { db } from "@/lib/db";

const MAX_DAYS = 366;
const FIELDS = ["type", "startDate", "endDate", "startTime", "endTime", "reason"] as const;

const optionalTime = z.union([z.literal(""), timeField]);

const schema = z.object({
  type: z.enum(["HOLIDAY", "BLOCK"]),
  startDate: dateField,
  endDate: dateField,
  startTime: optionalTime,
  endTime: optionalTime,
  reason: z.string().trim().max(200, "200 caractères maximum."),
});

export async function createTimeOff(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const allDay = readFlag(formData, "allDay");
  const values: Record<string, string> = Object.fromEntries(FIELDS.map((key) => [key, readText(formData, key)]));
  values.allDay = allDay ? "on" : "";

  const parsed = schema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const data = parsed.data;

  if (!allDay) {
    const errors: Record<string, string[]> = {};
    if (!data.startTime) errors.startTime = ["Indiquez l'heure de début."];
    if (!data.endTime) errors.endTime = ["Indiquez l'heure de fin."];
    if (Object.keys(errors).length > 0) return { errors, values };
  }

  // Journée entière : de minuit le premier jour à minuit après le dernier jour.
  const startsAt = allDay ? parisToUtc(data.startDate, 0) : parisInstant(data.startDate, data.startTime);
  const endsAt = allDay ? parisToUtc(addDays(data.endDate, 1), 0) : parisInstant(data.endDate, data.endTime);

  if (endsAt <= startsAt) return { errors: { endDate: ["La fin doit suivre le début."] }, values };
  if (endsAt.getTime() - startsAt.getTime() > MAX_DAYS * 86_400_000) {
    return { errors: { endDate: [`${MAX_DAYS} jours maximum.`] }, values };
  }

  const created = await db.timeOff.create({
    data: { type: data.type, startsAt, endsAt, reason: data.reason || null },
    select: { id: true },
  });

  await audit(admin.id, "TIME_OFF_CREATE", "time_off", created.id);
  redirect("/admin/planning/absences");
}

export async function deleteTimeOff(id: number): Promise<FormState> {
  const admin = await requireAdmin();

  const { count } = await db.timeOff.deleteMany({ where: { id } });
  if (count > 0) await audit(admin.id, "TIME_OFF_DELETE", "time_off", id);
  redirect("/admin/planning/absences");
}
