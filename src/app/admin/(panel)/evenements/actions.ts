"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  dateField,
  eurosToCents,
  fieldErrors,
  flagValue,
  isUniqueViolation,
  optionalEuros,
  parisInstant,
  readFlag,
  readText,
  timeField,
  type FormState,
} from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin, requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { EVENTS_TAG } from "@/lib/events";
import { slugify } from "@/lib/slug";

const TEXT_FIELDS = ["title", "slug", "description", "date", "time", "location", "price", "capacity"] as const;

const eventSchema = z.object({
  title: z.string().trim().min(2, "Indiquez un titre.").max(120, "120 caractères maximum."),
  slug: z
    .string()
    .trim()
    .max(120, "120 caractères maximum.")
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Minuscules, chiffres et tirets uniquement."),
  description: z.string().trim().max(4000, "4 000 caractères maximum."),
  date: dateField,
  time: timeField,
  location: z.string().trim().max(200, "200 caractères maximum."),
  price: optionalEuros,
  capacity: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^\d{1,5}$/, "Nombre entier requis.")
      .refine((value) => Number(value) >= 1, "1 place minimum."),
  ]),
  isPublished: z.boolean(),
});

export async function saveEvent(id: number | null, _previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const isPublished = readFlag(formData, "isPublished");
  const values = {
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, readText(formData, key)])),
    isPublished: flagValue(isPublished),
  };

  const parsed = eventSchema.safeParse({ ...values, isPublished });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const data = parsed.data;

  const payload = {
    title: data.title,
    slug: data.slug || slugify(data.title),
    description: data.description,
    startsAt: parisInstant(data.date, data.time),
    location: data.location || null,
    priceCents: eurosToCents(data.price),
    capacity: data.capacity === "" ? null : Number(data.capacity),
    isPublished: data.isPublished,
  };
  if (!payload.slug) return { errors: { slug: ["Indiquez un lien lisible."] }, values };

  let eventId = id;
  try {
    if (id === null) eventId = (await db.event.create({ data: payload, select: { id: true } })).id;
    else await db.event.update({ where: { id }, data: payload });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { slug: ["Ce lien est déjà utilisé par un autre événement."] }, values };
    }
    throw error;
  }

  await audit(admin.id, id === null ? "EVENT_CREATE" : "EVENT_UPDATE", "event", eventId!);
  updateTag(EVENTS_TAG);
  redirect(id === null ? `/admin/evenements/${eventId}` : "/admin/evenements");
}

// Les inscriptions sont supprimées avec l'événement (cascade).
export async function deleteEvent(id: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const { count } = await db.event.deleteMany({ where: { id } });
  if (count > 0) await audit(admin.id, "EVENT_DELETE", "event", id);
  updateTag(EVENTS_TAG);
  redirect("/admin/evenements");
}

// L'inscription est conservée (statut annulé) : la place est libérée, la trace reste.
export async function cancelRegistration(eventId: number, registrationId: number): Promise<void> {
  const admin = await requireAdmin();

  const { count } = await db.eventRegistration.updateMany({
    where: { id: registrationId, eventId, status: "CONFIRMED" },
    data: { status: "CANCELLED" },
  });
  if (count > 0) await audit(admin.id, "EVENT_REGISTRATION_CANCEL", "event_registration", registrationId);
  redirect(`/admin/evenements/${eventId}`);
}
