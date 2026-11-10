import { z } from "zod";
import { phoneNumber } from "@/modules/booking/schemas";

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(100, "100 caractères maximum."),
  email: z
    .email("Adresse e-mail invalide.")
    .max(254, "254 caractères maximum.")
    .transform((value) => value.toLowerCase()),
  // Facultatif : chaîne vide acceptée.
  phone: z.union([z.literal(""), phoneNumber]).optional(),
  consent: z.literal(true, "Le consentement est nécessaire pour enregistrer votre inscription."),
  // Champ piège invisible : un robot le remplit, une personne non.
  website: z.string().max(200).optional(),
});
