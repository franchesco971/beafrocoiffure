"use server";

import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { dateField, fieldErrors, parisInstant, readText, timeField, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guard";
import { dateKeyOf } from "@/lib/date";
import { BookingLockedError, BookingNotFoundError, ServicesUnavailableError } from "@/modules/booking/booking.service";
import {
  ClientNotFoundError,
  PlanningConflictError,
  cancelAdminBooking,
  clearChangeRequest,
  createAdminBooking,
  moveBooking,
  updateAdminBooking,
} from "@/modules/booking/planning.service";
import { MAX_SERVICES_PER_BOOKING, clientContactSchema } from "@/modules/booking/schemas";

const planningUrl = (date: string) => `/admin/planning?date=${date}`;

const knownFailure = (error: unknown) =>
  error instanceof PlanningConflictError ||
  error instanceof ServicesUnavailableError ||
  error instanceof ClientNotFoundError ||
  error instanceof BookingLockedError;

const LOCATIONS = ["", "SALON", "HOME", "MOBILE"] as const;

const details = {
  locationType: z.enum(LOCATIONS),
  address: z.string().trim().max(300, "300 caractères maximum."),
  notes: z.string().trim().max(500, "500 caractères maximum."),
};

const schedule = { date: dateField, time: timeField };

const createSchema = z.object({
  ...schedule,
  ...details,
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED"]),
  serviceIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Choisissez au moins une prestation.")
    .max(MAX_SERVICES_PER_BOOKING, `${MAX_SERVICES_PER_BOOKING} prestations maximum.`)
    .refine((ids) => new Set(ids).size === ids.length, "Prestation en double."),
});

const editSchema = z.object({
  ...schedule,
  ...details,
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"]),
});

const CREATE_FIELDS = [
  "date",
  "time",
  "status",
  "locationType",
  "address",
  "notes",
  "clientId",
  "firstName",
  "lastName",
  "phone",
  "email",
] as const;

const EDIT_FIELDS = ["date", "time", "status", "locationType", "address", "notes"] as const;

const readFields = (formData: FormData, fields: readonly string[]): Record<string, string> =>
  Object.fromEntries(fields.map((key) => [key, readText(formData, key)]));

export async function createBookingAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const serviceIds = formData.getAll("serviceIds").map(String);
  const values: Record<string, string> = { ...readFields(formData, CREATE_FIELDS), serviceIds: serviceIds.join(",") };
  const clientId = /^\d+$/.test(values.clientId) ? Number(values.clientId) : null;

  const booking = createSchema.safeParse({ ...values, serviceIds });
  const contact = clientId === null ? clientContactSchema.safeParse(values) : null;
  if (!booking.success || contact?.success === false) {
    return {
      errors: {
        ...(booking.success ? {} : fieldErrors(booking.error)),
        ...(contact?.success === false ? fieldErrors(contact.error) : {}),
      },
      values,
    };
  }

  const { date, time, ...data } = booking.data;
  let created;
  try {
    created = await createAdminBooking({
      serviceIds: data.serviceIds,
      startsAt: parisInstant(date, time),
      status: data.status,
      client:
        clientId !== null
          ? { id: clientId }
          : { ...contact!.data, email: contact!.data.email ? contact!.data.email.toLowerCase() : null },
      locationType: data.locationType || null,
      address: data.address || null,
      notes: data.notes || null,
    });
  } catch (error) {
    if (knownFailure(error)) return { message: (error as Error).message, values };
    throw error;
  }

  await audit(admin.id, "BOOKING_CREATE", "booking", created.id);
  redirect(planningUrl(dateKeyOf(created.startsAt)));
}

export async function saveBookingAction(id: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const values = readFields(formData, EDIT_FIELDS);
  const parsed = editSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { date, time, locationType, address, notes, status } = parsed.data;
  let saved;
  try {
    saved = await updateAdminBooking(id, {
      startsAt: parisInstant(date, time),
      status,
      locationType: locationType || null,
      address: address || null,
      notes: notes || null,
    });
  } catch (error) {
    if (error instanceof BookingNotFoundError) notFound();
    if (knownFailure(error)) return { message: (error as Error).message, values };
    throw error;
  }

  await audit(admin.id, "BOOKING_UPDATE", "booking", id);
  redirect(planningUrl(dateKeyOf(saved.startsAt)));
}

export async function cancelBookingAction(id: number): Promise<FormState> {
  const admin = await requireAdmin();

  try {
    await cancelAdminBooking(id);
  } catch (error) {
    if (error instanceof BookingNotFoundError) notFound();
    throw error;
  }

  await audit(admin.id, "BOOKING_CANCEL", "booking", id);
  redirect("/admin/planning");
}

/** Marque la demande de modification du client comme traitée, sans déplacer le rendez-vous. */
export async function dismissChangeRequestAction(id: number) {
  const admin = await requireAdmin();
  await clearChangeRequest(id).catch((error) => {
    if (error instanceof BookingNotFoundError) notFound();
    throw error;
  });
  await audit(admin.id, "BOOKING_CHANGE_DISMISSED", "booking", id);
  refresh();
}

export type MoveResult = { ok: true } | { ok: false; message: string };

/** Glisser-déposer du calendrier : `startsAt` est l'instant ISO (avec décalage) de la nouvelle heure de début. */
export async function moveBookingAction(id: number, startsAt: string): Promise<MoveResult> {
  const admin = await requireAdmin();

  const parsed = z.iso.datetime({ offset: true }).safeParse(startsAt);
  if (!parsed.success) return { ok: false, message: "Horaire invalide." };

  try {
    await moveBooking(id, new Date(parsed.data));
  } catch (error) {
    if (error instanceof BookingNotFoundError) return { ok: false, message: error.message };
    if (knownFailure(error)) return { ok: false, message: (error as Error).message };
    throw error;
  }

  await audit(admin.id, "BOOKING_MOVE", "booking", id);
  return { ok: true };
}
