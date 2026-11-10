import type { NextRequest } from "next/server";
import { apiError, json, readJson, tooManyRequests, validationError } from "@/lib/api";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import {
  AlreadyRegisteredError,
  EventFullError,
  EventUnavailableError,
  registerForEvent,
} from "@/modules/events/events.service";
import { registrationSchema } from "@/modules/events/schemas";

// Anti-abus : 10 inscriptions valides par adresse IP et par heure (Turnstile viendra à l'étape 7).
const limiter = createRateLimiter({ name: "event-registrations", limit: 10, windowMs: 60 * 60_000 });

export async function POST(request: NextRequest, ctx: RouteContext<"/api/events/[id]/register">) {
  const ip = clientIp(request);
  const blocked = limiter.retryAfter(ip);
  if (blocked) return tooManyRequests(blocked);

  const eventId = Number((await ctx.params).id);
  if (!Number.isSafeInteger(eventId) || eventId < 1) return apiError(404, "not_found", "Événement introuvable.");

  const body = await readJson(request);
  if (body === null) return apiError(400, "invalid_body", "Requête illisible.");

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  limiter.hit(ip);
  const { website, name, email, phone } = parsed.data;

  // Robot détecté : réponse de succès sans rien enregistrer.
  if (website) return json({ registered: true }, 201);

  try {
    await registerForEvent({ eventId, name, email, phone });
    return json({ registered: true }, 201);
  } catch (error) {
    if (error instanceof EventUnavailableError) return apiError(404, "event_unavailable", error.message);
    if (error instanceof EventFullError) return apiError(409, "event_full", error.message);
    if (error instanceof AlreadyRegisteredError) return apiError(409, "already_registered", error.message);
    throw error;
  }
}
