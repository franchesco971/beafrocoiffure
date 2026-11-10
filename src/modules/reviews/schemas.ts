import { z } from "zod";

export const newReviewSchema = z.object({
  author: z.string().trim().min(2, "Indiquez votre prénom.").max(60, "60 caractères maximum."),
  rating: z.number("Choisissez une note.").int("Choisissez une note.").min(1, "Choisissez une note.").max(5),
  text: z.string().trim().min(10, "Votre avis est trop court.").max(1000, "1 000 caractères maximum."),
  // Champ piège invisible : un robot le remplit, une personne non.
  website: z.string().max(200).optional(),
});
