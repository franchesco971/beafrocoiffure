import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(100, "100 caractères maximum."),
  email: z
    .email("Adresse e-mail invalide.")
    .max(254, "254 caractères maximum.")
    .transform((value) => value.toLowerCase()),
  message: z.string().trim().min(10, "Votre message est trop court.").max(2000, "2 000 caractères maximum."),
  consent: z.literal(true, "Le consentement est nécessaire pour traiter votre message."),
  // Champ piège invisible : un robot le remplit, une personne non.
  website: z.string().max(200).optional(),
});
