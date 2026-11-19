import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Invalidée par l'administration des événements. Les places restantes ne sont pas mises en cache.
export const EVENTS_TAG = "events";

// Sans DATABASE_URL (build Vercel sans base), aucun événement n'est publié.
const hasDatabase = Boolean(process.env.DATABASE_URL);

const eventSummary = {
  id: true,
  slug: true,
  title: true,
  description: true,
  startsAt: true,
  location: true,
  priceCents: true,
  capacity: true,
} as const;

export async function getUpcomingEvents() {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("minutes");
  if (!hasDatabase) return [];

  return db.event.findMany({
    where: { isPublished: true, startsAt: { gt: new Date() } },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: eventSummary,
  });
}

export async function getPublishedEvent(slug: string) {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("minutes");
  if (!hasDatabase) return null;

  return db.event.findFirst({ where: { slug, isPublished: true }, select: eventSummary });
}

export async function getPublishedEventSlugs() {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("minutes");
  if (!hasDatabase) return [];

  const events = await db.event.findMany({ where: { isPublished: true }, select: { slug: true } });
  return events.map(({ slug }) => slug);
}
