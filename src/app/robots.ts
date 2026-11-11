import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Les liens de rendez-vous (`/reservation/<jeton>`) et l'administration ne doivent jamais être explorés.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/reservation/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
