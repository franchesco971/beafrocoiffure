"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { timeField, toMinutes, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";

const DAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const MAX_RANGES_PER_DAY = 4;

const hoursSchema = z
  .array(z.object({ weekday: z.number().int().min(1).max(7), start: timeField, end: timeField }))
  .max(7 * MAX_RANGES_PER_DAY);

type Row = z.infer<typeof hoursSchema>[number];

// Chaque plage doit finir après son début, sans chevaucher les autres plages du même jour.
function validationMessage(rows: Row[]) {
  for (let weekday = 1; weekday <= 7; weekday++) {
    const day = rows.filter((row) => row.weekday === weekday).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    if (day.length > MAX_RANGES_PER_DAY) return `${MAX_RANGES_PER_DAY} plages maximum le ${DAY_NAMES[weekday - 1]}.`;
    for (const [index, row] of day.entries()) {
      if (toMinutes(row.end) <= toMinutes(row.start)) {
        return `Le ${DAY_NAMES[weekday - 1]} : l'heure de fin doit suivre l'heure de début.`;
      }
      if (index > 0 && toMinutes(row.start) < toMinutes(day[index - 1].end)) {
        return `Le ${DAY_NAMES[weekday - 1]} : des plages se chevauchent.`;
      }
    }
  }
  return null;
}

const asTime = (time: string) => new Date(`1970-01-01T${time}:00Z`);

export async function saveWorkingHours(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("hours") ?? ""));
  } catch {
    return { message: "Horaires illisibles : rechargez la page." };
  }
  const parsed = hoursSchema.safeParse(raw);
  if (!parsed.success) return { message: "Horaires invalides : vérifiez les heures saisies." };

  const message = validationMessage(parsed.data);
  if (message) return { message };

  await db.$transaction([
    db.workingHours.deleteMany(),
    db.workingHours.createMany({
      data: parsed.data.map((row) => ({
        weekday: row.weekday,
        startTime: asTime(row.start),
        endTime: asTime(row.end),
      })),
    }),
  ]);

  await audit(admin.id, "WORKING_HOURS_UPDATE", "working_hours");
  redirect("/admin/planning");
}
