"use server";

import { redirect } from "next/navigation";
import { fieldErrors, isUniqueViolation, readText, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { clientContactSchema } from "@/modules/booking/schemas";

const FIELDS = ["firstName", "lastName", "phone", "email"] as const;

export async function saveClient(id: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const values: Record<string, string> = Object.fromEntries(FIELDS.map((key) => [key, readText(formData, key)]));
  const parsed = clientContactSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { email, ...contact } = parsed.data;
  try {
    await db.client.update({ where: { id }, data: { ...contact, email: email ? email.toLowerCase() : null } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { email: ["Cette adresse est déjà utilisée par une autre fiche."] }, values };
    }
    throw error;
  }

  await audit(admin.id, "CLIENT_UPDATE", "client", id);
  redirect(`/admin/clients/${id}`);
}
