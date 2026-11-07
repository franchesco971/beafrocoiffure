"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrors, isForeignKeyViolation, isUniqueViolation, readText, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guard";
import { CATALOG_TAG } from "@/lib/catalog";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

const TEXT_FIELDS = ["name", "slug", "universe", "position"] as const;

const categorySchema = z.object({
  name: z.string().trim().min(2, "Indiquez un nom.").max(80, "80 caractères maximum."),
  slug: z
    .string()
    .trim()
    .max(80, "80 caractères maximum.")
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Minuscules, chiffres et tirets uniquement."),
  universe: z.enum(["HAIR", "WELLNESS"]),
  position: z.coerce.number().int("Nombre entier requis.").min(0, "0 minimum.").max(9999, "9 999 maximum."),
});

export async function saveCategory(id: number | null, _previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values = Object.fromEntries(TEXT_FIELDS.map((key) => [key, readText(formData, key)]));
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const data = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name) };
  if (!data.slug) return { errors: { slug: ["Indiquez un lien lisible."] }, values };

  let categoryId = id;
  try {
    if (id === null) categoryId = (await db.serviceCategory.create({ data, select: { id: true } })).id;
    else await db.serviceCategory.update({ where: { id }, data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { slug: ["Ce lien est déjà utilisé par une autre catégorie."] }, values };
    }
    throw error;
  }

  await audit(admin.id, id === null ? "CATEGORY_CREATE" : "CATEGORY_UPDATE", "service_category", categoryId!);
  updateTag(CATALOG_TAG);
  redirect("/admin/prestations");
}

export async function deleteCategory(id: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  try {
    await db.serviceCategory.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { message: "Cette catégorie contient des prestations : déplacez-les ou supprimez-les d'abord." };
    }
    throw error;
  }

  await audit(admin.id, "CATEGORY_DELETE", "service_category", id);
  updateTag(CATALOG_TAG);
  redirect("/admin/prestations");
}
