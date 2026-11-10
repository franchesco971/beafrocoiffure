import { cacheLife, cacheTag } from "next/cache";
import { CONTENT_SCHEMAS, DEFAULT_CONTENT, type ContentKey, type ContentMap } from "@/content/pages";
import { db } from "@/lib/db";

// Invalidée par les actions d'administration des contenus.
export const CONTENT_TAG = "content";

const LOCALE = "fr";

// Sans DATABASE_URL (build Vercel sans base), les valeurs par défaut sont renvoyées.
const hasDatabase = Boolean(process.env.DATABASE_URL);

/** Contenu enregistré s'il est valide, sinon valeur par défaut. */
export async function getContent<K extends ContentKey>(key: K): Promise<ContentMap[K]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  if (!hasDatabase) return DEFAULT_CONTENT[key];

  const row = await db.pageContent.findUnique({ where: { key_locale: { key, locale: LOCALE } } });
  const parsed = CONTENT_SCHEMAS[key].safeParse(row?.content);
  return parsed.success ? (parsed.data as ContentMap[K]) : DEFAULT_CONTENT[key];
}

export async function saveContent<K extends ContentKey>(key: K, content: ContentMap[K]) {
  await db.pageContent.upsert({
    where: { key_locale: { key, locale: LOCALE } },
    update: { content },
    create: { key, locale: LOCALE, content },
  });
}
