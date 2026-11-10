import type { MediaType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { deleteUpload, saveUpload } from "@/lib/storage";
import {
  InvalidMediaError,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  detectVideo,
  processImage,
} from "@/modules/media/process";

export { InvalidMediaError };

async function storeFile(file: File): Promise<{ type: MediaType; url: string }> {
  if (file.size > MAX_VIDEO_BYTES) throw new InvalidMediaError("Fichier trop lourd (50 Mo maximum pour une vidéo).");
  const data = Buffer.from(await file.arrayBuffer());

  const video = detectVideo(data);
  if (video) return { type: "VIDEO", url: await saveUpload(data, video) };

  if (data.length > MAX_IMAGE_BYTES) throw new InvalidMediaError("Image trop lourde (15 Mo maximum).");
  return { type: "IMAGE", url: await saveUpload(await processImage(data), "webp") };
}

export type NewMedia = {
  file: File;
  /** Photo « avant » : transforme une photo en avant/après. */
  before?: File | null;
  categoryId: number | null;
  alt: string | null;
};

/** Traite et enregistre les fichiers, puis la ligne en base ; les fichiers sont supprimés si l'une des étapes échoue. */
export async function createMedia({ file, before, categoryId, alt }: NewMedia) {
  const saved: string[] = [];
  try {
    const main = await storeFile(file);
    saved.push(main.url);

    let beforeUrl: string | null = null;
    if (before) {
      if (main.type === "VIDEO") throw new InvalidMediaError("L'avant/après est réservé aux photos.");
      const previous = await storeFile(before);
      saved.push(previous.url);
      if (previous.type !== "IMAGE") throw new InvalidMediaError("La photo « avant » doit être une image.");
      beforeUrl = previous.url;
    }

    return await db.media.create({
      data: {
        type: main.type,
        url: main.url,
        beforeUrl,
        isBeforeAfter: beforeUrl !== null,
        alt,
        galleryCategoryId: categoryId,
      },
      select: { id: true },
    });
  } catch (error) {
    await Promise.all(saved.map(deleteUpload));
    throw error;
  }
}

/** Supprime la ligne puis ses fichiers ; false si le média n'existe plus. */
export async function removeMedia(id: number) {
  const media = await db.media.findUnique({ where: { id }, select: { url: true, beforeUrl: true } });
  if (!media) return false;

  await db.media.delete({ where: { id } });
  await Promise.all([deleteUpload(media.url), deleteUpload(media.beforeUrl)]);
  return true;
}
