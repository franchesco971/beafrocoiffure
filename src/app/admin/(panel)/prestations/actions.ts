"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  eurosToCents,
  fieldErrors,
  flagValue,
  isForeignKeyViolation,
  isUniqueViolation,
  optionalEuros,
  readFlag,
  readText,
  type FormState,
} from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guard";
import { CATALOG_TAG } from "@/lib/catalog";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { getVideoEmbed } from "@/lib/video";

const TEXT_FIELDS = [
  "title",
  "slug",
  "categoryId",
  "description",
  "videoUrl",
  "priceMode",
  "price",
  "durationMin",
  "deposit",
  "conditions",
  "position",
] as const;

const serviceSchema = z
  .object({
    title: z.string().trim().min(2, "Indiquez un titre.").max(120, "120 caractères maximum."),
    slug: z
      .string()
      .trim()
      .max(120, "120 caractères maximum.")
      .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Minuscules, chiffres et tirets uniquement."),
    categoryId: z.coerce.number().int().positive("Choisissez une catégorie."),
    description: z.string().trim().max(2000, "2 000 caractères maximum."),
    videoUrl: z
      .string()
      .trim()
      .max(500, "500 caractères maximum.")
      .refine(
        (value) => value === "" || getVideoEmbed(value) !== null,
        "Lien https YouTube, Vimeo ou fichier .mp4/.webm.",
      ),
    priceMode: z.enum(["FIXED", "QUOTE"]),
    price: optionalEuros,
    durationMin: z.coerce.number().int("Nombre entier requis.").min(5, "5 minutes minimum.").max(1440, "24 h maximum."),
    deposit: optionalEuros,
    conditions: z.string().trim().max(4000, "4 000 caractères maximum."),
    position: z.coerce.number().int("Nombre entier requis.").min(0, "0 minimum.").max(9999, "9 999 maximum."),
    requiresValidation: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((data) => data.priceMode !== "FIXED" || data.price !== "", {
    path: ["price"],
    message: "Indiquez le tarif.",
  });

export async function saveService(id: number | null, _previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const flags = {
    requiresValidation: readFlag(formData, "requiresValidation"),
    isActive: readFlag(formData, "isActive"),
  };
  const values = {
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, readText(formData, key)])),
    requiresValidation: flagValue(flags.requiresValidation),
    isActive: flagValue(flags.isActive),
  };

  const parsed = serviceSchema.safeParse({ ...values, ...flags });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const data = parsed.data;

  const payload = {
    title: data.title,
    slug: data.slug || slugify(data.title),
    categoryId: data.categoryId,
    description: data.description,
    videoUrl: data.videoUrl || null,
    priceMode: data.priceMode,
    priceCents: data.priceMode === "FIXED" ? eurosToCents(data.price) : null,
    durationMin: data.durationMin,
    depositCents: eurosToCents(data.deposit),
    conditions: data.conditions || null,
    requiresValidation: data.requiresValidation,
    isActive: data.isActive,
    position: data.position,
  };
  if (!payload.slug) return { errors: { slug: ["Indiquez un lien lisible."] }, values };

  let serviceId = id;
  try {
    if (id === null) serviceId = (await db.service.create({ data: payload, select: { id: true } })).id;
    else await db.service.update({ where: { id }, data: payload });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { slug: ["Ce lien est déjà utilisé par une autre prestation."] }, values };
    }
    if (isForeignKeyViolation(error)) return { errors: { categoryId: ["Catégorie introuvable."] }, values };
    throw error;
  }

  await audit(admin.id, id === null ? "SERVICE_CREATE" : "SERVICE_UPDATE", "service", serviceId!);
  updateTag(CATALOG_TAG);
  redirect("/admin/prestations");
}

export async function deleteService(id: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  try {
    await db.service.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { message: "Cette prestation figure dans des réservations : désactivez-la plutôt que de la supprimer." };
    }
    throw error;
  }

  await audit(admin.id, "SERVICE_DELETE", "service", id);
  updateTag(CATALOG_TAG);
  redirect("/admin/prestations");
}
