import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Lectures publiques mises en cache ; les actions d'administration invalident cette étiquette.
export const CATALOG_TAG = "catalog";

// Sans DATABASE_URL (build Vercel sans base), le catalogue est vide au lieu de faire échouer le prérendu.
const hasDatabase = Boolean(process.env.DATABASE_URL);

const serviceSummary = {
  slug: true,
  title: true,
  description: true,
  durationMin: true,
  priceMode: true,
  priceCents: true,
} as const;

export async function getHairCatalog() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!hasDatabase) return [];

  return db.serviceCategory.findMany({
    where: { universe: "HAIR", services: { some: { isActive: true } } },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      services: { where: { isActive: true }, orderBy: [{ position: "asc" }, { id: "asc" }], select: serviceSummary },
    },
  });
}

export async function getHairService(slug: string) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!hasDatabase) return null;

  return db.service.findFirst({
    where: { slug, isActive: true, category: { universe: "HAIR" } },
    select: {
      ...serviceSummary,
      videoUrl: true,
      conditions: true,
      requiresValidation: true,
      depositCents: true,
      category: { select: { name: true } },
    },
  });
}

export async function getHairServiceSlugs() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!hasDatabase) return [];

  const services = await db.service.findMany({
    where: { isActive: true, category: { universe: "HAIR" } },
    select: { slug: true },
  });
  return services.map(({ slug }) => slug);
}

// Prestations de l'univers Beauté & Bien-être (réservables, sans page de détail).
export async function getWellnessServices() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!hasDatabase) return [];

  return db.service.findMany({
    where: { isActive: true, category: { universe: "WELLNESS" } },
    orderBy: [{ category: { position: "asc" } }, { position: "asc" }, { id: "asc" }],
    select: serviceSummary,
  });
}

// Toutes les prestations réservables (coiffure et beauté), pour le tunnel de réservation.
export async function getBookableCatalog() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!hasDatabase) return [];

  return db.serviceCategory.findMany({
    where: { services: { some: { isActive: true } } },
    orderBy: [{ universe: "asc" }, { position: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      universe: true,
      services: {
        where: { isActive: true },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          durationMin: true,
          priceMode: true,
          priceCents: true,
          requiresValidation: true,
        },
      },
    },
  });
}

export type BookableCatalog = Awaited<ReturnType<typeof getBookableCatalog>>;
export type BookableService = BookableCatalog[number]["services"][number];
