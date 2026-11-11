import { z } from "zod";
import { DEFAULT_LEGAL, LEGAL_KEYS } from "@/content/legal";

export { LEGAL_KEYS, LEGAL_PAGES, LEGAL_PLACEHOLDER, type LegalKey } from "@/content/legal";

// Textes modifiables depuis l'administration (table `page_content`) : schémas de validation et valeurs par défaut.

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const optionalLink = z
  .string()
  .trim()
  .max(300, "300 caractères maximum.")
  .refine((value) => value === "" || isHttpsUrl(value), "Lien https invalide.");

export const contactContentSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, "254 caractères maximum.")
    .refine((value) => value === "" || z.email().safeParse(value).success, "E-mail invalide."),
  phone: z.string().trim().max(30, "30 caractères maximum."),
  address: z.string().trim().max(300, "300 caractères maximum."),
  instagram: optionalLink,
  facebook: optionalLink,
  tiktok: optionalLink,
});

export const WELLNESS_OFFER_SLOTS = 4;

export const wellnessContentSchema = z.object({
  intro: z.string().trim().max(1500, "1 500 caractères maximum."),
  offers: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80, "80 caractères maximum."),
        text: z.string().trim().max(600, "600 caractères maximum."),
      }),
    )
    .max(WELLNESS_OFFER_SLOTS),
});

export const legalContentSchema = z.object({
  // Les retours à la ligne des formulaires (\r\n) sont normalisés avant l'enregistrement.
  body: z.string().trim().min(1, "Le texte ne peut pas être vide.").max(30_000, "30 000 caractères maximum."),
});

export const CONTENT_SCHEMAS = {
  "site.contact": contactContentSchema,
  "page.wellness": wellnessContentSchema,
  "legal.mentions": legalContentSchema,
  "legal.privacy": legalContentSchema,
  "legal.terms": legalContentSchema,
} as const;

export type ContentKey = keyof typeof CONTENT_SCHEMAS;
export type ContentMap = { [K in ContentKey]: z.infer<(typeof CONTENT_SCHEMAS)[K]> };

export const isLegalKey = (key: string): key is (typeof LEGAL_KEYS)[number] =>
  (LEGAL_KEYS as readonly string[]).includes(key);

export const DEFAULT_CONTENT: ContentMap = {
  ...DEFAULT_LEGAL,
  "site.contact": { email: "", phone: "", address: "", instagram: "", facebook: "", tiktok: "" },
  "page.wellness": {
    intro: "Une conseillère indépendante à vos côtés pour choisir, tester et adopter les bons produits.",
    offers: [
      {
        title: "Conseil sur les produits",
        text: "Un avis franc et adapté à votre peau, vos cheveux et votre routine, pour choisir ce qui vous convient vraiment.",
      },
      {
        title: "Séances de testing de produits",
        text: "Essayez avant d’acheter : des séances dédiées pour tester des produits en situation, avec des retours précis.",
      },
      {
        title: "Accompagnements personnalisés",
        text: "Un suivi sur mesure pour construire, à votre rythme, une routine beauté et bien-être qui vous ressemble.",
      },
    ],
  },
};
