import type { NextRequest } from "next/server";
import { apiError, json, tooManyRequests, validationError } from "@/lib/api";
import { monthBounds } from "@/lib/date";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { getAvailability, ServicesUnavailableError } from "@/modules/booking/booking.service";
import { availabilityQuerySchema } from "@/modules/booking/schemas";

// Le tunnel interroge un mois entier puis relit le jour choisi : marge confortable par minute et par adresse IP.
const limiter = createRateLimiter({ name: "availability", limit: 60, windowMs: 60_000 });

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const blocked = limiter.retryAfter(ip);
  if (blocked) return tooManyRequests(blocked);
  limiter.hit(ip);

  const params = request.nextUrl.searchParams;
  const parsed = availabilityQuerySchema.safeParse({
    services: params.get("services") ?? "",
    date: params.get("date") ?? undefined,
    month: params.get("month") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  const { services: serviceIds, date, month } = parsed.data;
  const range = date ? { from: date, to: date } : monthBounds(month!)!;

  try {
    const days = await getAvailability({ serviceIds, ...range });
    if (date) return json({ date, slots: days[date].map((slot) => slot.toISOString()) });

    const withSlots = Object.entries(days).filter(([, slots]) => slots.length > 0);
    return json({
      month,
      days: Object.fromEntries(withSlots.map(([day, slots]) => [day, slots.map((slot) => slot.toISOString())])),
    });
  } catch (error) {
    if (error instanceof ServicesUnavailableError) return apiError(422, "services_unavailable", error.message);
    throw error;
  }
}
