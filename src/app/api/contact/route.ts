import type { NextRequest } from "next/server";
import { apiError, json, readJson, tooManyRequests, validationError } from "@/lib/api";
import { db } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { contactMessageSchema } from "@/modules/contact/schemas";

// Anti-abus : 5 messages valides par adresse IP et par heure (Turnstile viendra à l'étape 7).
const limiter = createRateLimiter({ name: "contact", limit: 5, windowMs: 60 * 60_000 });

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const blocked = limiter.retryAfter(ip);
  if (blocked) return tooManyRequests(blocked);

  const body = await readJson(request);
  if (body === null) return apiError(400, "invalid_body", "Requête illisible.");

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  limiter.hit(ip);
  const { website, name, email, message } = parsed.data;

  // Robot détecté : réponse de succès sans rien enregistrer.
  if (!website) await db.contactMessage.create({ data: { name, email, message, consentAt: new Date() } });
  return json({ received: true }, 201);
}
