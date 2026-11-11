import type { MetadataRoute } from "next";
import { LEGAL_KEYS, LEGAL_PAGES } from "@/content/pages";
import { getHairServiceSlugs } from "@/lib/catalog";
import { getPublishedEventSlugs } from "@/lib/events";
import { absoluteUrl } from "@/lib/seo";

const STATIC_PATHS = [
  "/",
  "/coiffure",
  "/beaute-bien-etre",
  "/galerie",
  "/evenements",
  "/avis",
  "/contact",
  "/reservation",
  ...LEGAL_KEYS.map((key) => LEGAL_PAGES[key].path),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, events] = await Promise.all([getHairServiceSlugs(), getPublishedEventSlugs()]);

  return [
    ...STATIC_PATHS,
    ...services.map((slug) => `/coiffure/${slug}`),
    ...events.map((slug) => `/evenements/${slug}`),
  ].map((path) => ({ url: absoluteUrl(path) }));
}
