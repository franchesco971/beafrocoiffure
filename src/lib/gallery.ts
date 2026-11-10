import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Invalidée par l'administration de la galerie (actions serveur et téléversement).
export const GALLERY_TAG = "gallery";

// Sans DATABASE_URL (build Vercel sans base), la galerie est vide.
const hasDatabase = Boolean(process.env.DATABASE_URL);

export async function getGallery() {
  "use cache";
  cacheTag(GALLERY_TAG);
  cacheLife("hours");
  if (!hasDatabase) return { categories: [], items: [] };

  const [categories, items] = await Promise.all([
    db.galleryCategory.findMany({
      where: { media: { some: {} } },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
    db.media.findMany({
      orderBy: [{ position: "asc" }, { id: "desc" }],
      select: {
        id: true,
        type: true,
        url: true,
        beforeUrl: true,
        alt: true,
        galleryCategoryId: true,
      },
    }),
  ]);
  return { categories, items };
}

export type GalleryItem = Awaited<ReturnType<typeof getGallery>>["items"][number];
