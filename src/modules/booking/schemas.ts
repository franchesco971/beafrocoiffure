import { z } from "zod";
import { isDateKey, monthBounds } from "@/lib/date";

export const MAX_SERVICES_PER_BOOKING = 6;
export const MAX_RANGE_DAYS = 62;

const serviceIds = z
  .array(z.number().int().positive())
  .min(1, "Choisissez au moins une prestation.")
  .max(MAX_SERVICES_PER_BOOKING, `${MAX_SERVICES_PER_BOOKING} prestations maximum.`)
  .refine((ids) => new Set(ids).size === ids.length, "Prestation en double.");

/** Paramètre `services=1,2` d'une URL. */
const serviceIdsFromQuery = z
  .string()
  .regex(/^\d+(,\d+)*$/, "Liste de prestations invalide.")
  .transform((value) => value.split(",").map(Number))
  .pipe(serviceIds);

export const availabilityQuerySchema = z
  .object({
    services: serviceIdsFromQuery,
    date: z.string().refine(isDateKey, "Date invalide (AAAA-MM-JJ).").optional(),
    month: z
      .string()
      .refine((value) => monthBounds(value) !== null, "Mois invalide (AAAA-MM).")
      .optional(),
  })
  .refine((query) => (query.date === undefined) !== (query.month === undefined), {
    message: "Indiquez soit `date`, soit `month`.",
    path: ["date"],
  });

export const personName = z.string().trim().min(1, "Champ requis.").max(80, "80 caractères maximum.");

export const phoneNumber = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ().-]{6,20}$/, "Numéro de téléphone invalide.");

/** Coordonnées saisies par l'administration : l'adresse e-mail est facultative (chaîne vide). */
export const clientContactSchema = z.object({
  firstName: personName,
  lastName: personName,
  phone: phoneNumber,
  email: z.union([z.literal(""), z.email("Adresse e-mail invalide.").max(254, "254 caractères maximum.")]),
});

export const newBookingSchema = z.object({
  serviceIds,
  startsAt: z.iso.datetime("Créneau invalide."),
  firstName: personName,
  lastName: personName,
  phone: phoneNumber,
  email: z
    .email("Adresse e-mail invalide.")
    .max(254, "254 caractères maximum.")
    .transform((v) => v.toLowerCase()),
  notes: z.string().trim().max(500, "500 caractères maximum.").optional(),
  consent: z.literal(true, "Le consentement est nécessaire pour enregistrer votre demande."),
  // Champ piège invisible : un robot le remplit, une personne non.
  website: z.string().max(200).optional(),
});

export const bookingTokenSchema = z.string().regex(/^[0-9a-f]{64}$/, "Lien invalide.");

export const bookingActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("change"),
    message: z.string().trim().min(5, "Décrivez la modification souhaitée.").max(1000, "1 000 caractères maximum."),
  }),
]);
