"use server";

import { redirect } from "next/navigation";
import { fieldErrors, isUniqueViolation, readText, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin, requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { clientContactSchema } from "@/modules/booking/schemas";
import {
  ClientHasUpcomingBookingsError,
  ClientNotFoundError,
  anonymizeClient,
} from "@/modules/privacy/privacy.service";

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

// Droit à l'effacement : irréversible, réservé à l'administratrice.
export async function anonymizeClientAction(id: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  try {
    if (await anonymizeClient(id)) await audit(admin.id, "CLIENT_ANONYMIZE", "client", id);
  } catch (error) {
    if (error instanceof ClientHasUpcomingBookingsError || error instanceof ClientNotFoundError) {
      return { message: error.message };
    }
    throw error;
  }
  redirect(`/admin/clients/${id}`);
}
