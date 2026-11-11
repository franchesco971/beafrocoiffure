import type { NextRequest } from "next/server";
import { apiError, captchaFailed, json, readJson, tooManyRequests, validationError } from "@/lib/api";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { verifyTurnstile } from "@/lib/turnstile";
import { createBooking, ServicesUnavailableError, SlotUnavailableError } from "@/modules/booking/booking.service";
import { newBookingSchema } from "@/modules/booking/schemas";

// Anti-abus : 10 demandes valides par adresse IP et par heure, en plus du champ piège et de Turnstile (optionnel).
const limiter = createRateLimiter({ name: "bookings", limit: 10, windowMs: 60 * 60_000 });

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const blocked = limiter.retryAfter(ip);
  if (blocked) return tooManyRequests(blocked);

  const body = await readJson(request);
  if (body === null) return apiError(400, "invalid_body", "Requête illisible.");

  const parsed = newBookingSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  limiter.hit(ip);
  if (!(await verifyTurnstile(body, ip))) return captchaFailed();
  const { website, startsAt, ...data } = parsed.data;

  // Robot détecté : réponse de succès sans rien enregistrer.
  if (website) return json({ status: "PENDING", startsAt, cancelPath: null }, 201);

  try {
    const booking = await createBooking({ ...data, startsAt: new Date(startsAt) });
    return json(
      {
        status: booking.status,
        startsAt: booking.startsAt.toISOString(),
        cancelPath: `/reservation/${booking.cancelToken}`,
      },
      201,
    );
  } catch (error) {
    if (error instanceof SlotUnavailableError) return apiError(409, "slot_unavailable", error.message);
    if (error instanceof ServicesUnavailableError) return apiError(422, "services_unavailable", error.message);
    throw error;
  }
}
