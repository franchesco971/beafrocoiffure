import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isForeignKeyViolation } from "@/lib/admin/forms";
import { apiError, json, validationError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getAdmin } from "@/lib/auth/guard";
import { GALLERY_TAG } from "@/lib/gallery";
import { InvalidMediaError, createMedia } from "@/modules/media/media.service";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/modules/media/process";

const MAX_REQUEST_BYTES = MAX_VIDEO_BYTES + MAX_IMAGE_BYTES + 1024 * 1024;

const fieldsSchema = z.object({
  categoryId: z.union([z.literal(""), z.string().regex(/^\d+$/, "Catégorie invalide.")]),
  alt: z.string().trim().max(200, "200 caractères maximum."),
});

const isUpload = (value: FormDataEntryValue | null): value is File => value instanceof File && value.size > 0;

// Les fichiers dépassent la limite des actions serveur (et du proxy) : le téléversement passe par une route dédiée.
// Le proxy ne couvre que `/admin` : la session et le rôle sont vérifiés ici.
export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return apiError(401, "unauthorized", "Connexion requise.");
  if (admin.role !== "ADMIN") return apiError(403, "forbidden", "Accès refusé.");

  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
    return apiError(413, "too_large", "Fichiers trop lourds.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(400, "invalid_body", "Formulaire illisible.");
  }

  const fields = fieldsSchema.safeParse({ categoryId: form.get("categoryId") ?? "", alt: form.get("alt") ?? "" });
  if (!fields.success) return validationError(fields.error);

  const file = form.get("file");
  if (!isUpload(file)) {
    return apiError(400, "validation_error", "Choisissez un fichier.", {
      fields: { file: ["Choisissez un fichier."] },
    });
  }
  const before = form.get("before");

  try {
    const { categoryId, alt } = fields.data;
    const media = await createMedia({
      file,
      before: isUpload(before) ? before : null,
      categoryId: categoryId === "" ? null : Number(categoryId),
      alt: alt || null,
    });
    await audit(admin.id, "MEDIA_CREATE", "media", media.id);
    revalidateTag(GALLERY_TAG, { expire: 0 });
    return json({ id: media.id }, 201);
  } catch (error) {
    if (error instanceof InvalidMediaError) {
      return apiError(422, "invalid_media", error.message, { fields: { file: [error.message] } });
    }
    if (isForeignKeyViolation(error)) {
      return apiError(422, "validation_error", "Catégorie introuvable.", {
        fields: { categoryId: ["Catégorie introuvable."] },
      });
    }
    throw error;
  }
}
