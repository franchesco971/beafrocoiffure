import type { NextRequest } from "next/server";
import { apiError, captchaFailed, json, readJson, tooManyRequests, validationError } from "@/lib/api";
import { db } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { verifyTurnstile } from "@/lib/turnstile";
import { newReviewSchema } from "@/modules/reviews/schemas";

// Anti-abus : 3 avis valides par adresse IP et par jour, en plus du champ piège et de Turnstile (optionnel).
const limiter = createRateLimiter({ name: "reviews", limit: 3, windowMs: 24 * 60 * 60_000 });

// L'avis reste en attente : il n'est publié qu'après modération depuis l'administration.
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const blocked = limiter.retryAfter(ip);
  if (blocked) return tooManyRequests(blocked);

  const body = await readJson(request);
  if (body === null) return apiError(400, "invalid_body", "Requête illisible.");

  const parsed = newReviewSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  limiter.hit(ip);
  if (!(await verifyTurnstile(body, ip))) return captchaFailed();
  const { website, author, rating, text } = parsed.data;

  // Robot détecté : réponse de succès sans rien enregistrer.
  if (!website) await db.review.create({ data: { author, rating, text } });
  return json({ received: true }, 201);
}
