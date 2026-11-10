"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrors, isForeignKeyViolation, isUniqueViolation, readText, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { GALLERY_TAG } from "@/lib/gallery";
import { slugify } from "@/lib/slug";
import { removeMedia } from "@/modules/media/media.service";

const position = z.coerce.number().int("Nombre entier requis.").min(0, "0 minimum.").max(9999, "9 999 maximum.");

const mediaSchema = z.object({
  alt: z.string().trim().max(200, "200 caractères maximum."),
  categoryId: z.union([z.literal(""), z.string().regex(/^\d+$/, "Catégorie invalide.")]),
  position,
});

export async function updateMedia(id: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values = {
    alt: readText(formData, "alt"),
    categoryId: readText(formData, "categoryId"),
    position: readText(formData, "position"),
  };
  const parsed = mediaSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const data = parsed.data;

  try {
    await db.media.update({
      where: { id },
      data: {
        alt: data.alt || null,
        galleryCategoryId: data.categoryId === "" ? null : Number(data.categoryId),
        position: data.position,
      },
    });
  } catch (error) {
    if (isForeignKeyViolation(error)) return { errors: { categoryId: ["Catégorie introuvable."] }, values };
    throw error;
  }

  await audit(admin.id, "MEDIA_UPDATE", "media", id);
  updateTag(GALLERY_TAG);
  redirect("/admin/galerie");
}

export async function deleteMedia(id: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  if (await removeMedia(id)) await audit(admin.id, "MEDIA_DELETE", "media", id);
  updateTag(GALLERY_TAG);
  redirect("/admin/galerie");
}

const categorySchema = z.object({
  name: z.string().trim().min(2, "Indiquez un nom.").max(80, "80 caractères maximum."),
  position,
});

export async function saveGalleryCategory(
  id: number | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values = { name: readText(formData, "name"), position: readText(formData, "position") };
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { name, position } = parsed.data;
  const slug = slugify(name);
  if (!slug) return { errors: { name: ["Utilisez des lettres ou des chiffres."] }, values };

  // Le lien suit le nom à la création ; il n'est jamais exposé et reste stable ensuite.
  let categoryId = id;
  try {
    if (id === null) {
      categoryId = (await db.galleryCategory.create({ data: { name, slug, position }, select: { id: true } })).id;
    } else {
      await db.galleryCategory.update({ where: { id }, data: { name, position } });
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { errors: { name: ["Une catégorie porte déjà ce nom."] }, values };
    throw error;
  }

  await audit(
    admin.id,
    id === null ? "GALLERY_CATEGORY_CREATE" : "GALLERY_CATEGORY_UPDATE",
    "gallery_category",
    categoryId!,
  );
  updateTag(GALLERY_TAG);
  redirect("/admin/galerie");
}

// Les médias de la catégorie sont conservés, sans catégorie (`onDelete: SetNull`).
export async function deleteGalleryCategory(id: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const { count } = await db.galleryCategory.deleteMany({ where: { id } });
  if (count > 0) await audit(admin.id, "GALLERY_CATEGORY_DELETE", "gallery_category", id);
  updateTag(GALLERY_TAG);
  redirect("/admin/galerie");
}
