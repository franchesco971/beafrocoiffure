import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Invalidée par la modération des avis.
export const REVIEWS_TAG = "reviews";

// Sans DATABASE_URL (build Vercel sans base), aucun avis n'est publié.
const hasDatabase = Boolean(process.env.DATABASE_URL);

export async function getPublishedReviews() {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("hours");
  if (!hasDatabase) return { reviews: [], average: null, count: 0 };

  const where = { status: "APPROVED" } as const;
  const [reviews, stats] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: { id: true, author: true, rating: true, text: true, createdAt: true },
    }),
    db.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  return { reviews, average: stats._avg.rating, count: stats._count._all };
}
