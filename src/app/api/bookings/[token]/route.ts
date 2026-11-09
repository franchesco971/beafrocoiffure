import type { NextRequest } from "next/server";
import { apiError, json, readJson, tooManyRequests, validationError } from "@/lib/api";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import {
  BookingLockedError,
  BookingNotFoundError,
  cancelBooking,
  getBookingByToken,
  requestBookingChange,
  toPublicBooking,
} from "@/modules/booking/booking.service";
import { bookingActionSchema, bookingTokenSchema } from "@/modules/booking/schemas";

// Le jeton est indevinable (≥ 128 bits) ; la limite ralentit malgré tout les essais en masse.
const limiter = createRateLimiter({ name: "booking-token", limit: 60, windowMs: 10 * 60_000 });

function guard(request: NextRequest) {
  const ip = clientIp(request);
  const blocked = limiter.retryAfter(ip);
  if (blocked) return tooManyRequests(blocked);
  limiter.hit(ip);
  return null;
}

const notFound = () => apiError(404, "not_found", "Rendez-vous introuvable.");

export async function GET(request: NextRequest, ctx: RouteContext<"/api/bookings/[token]">) {
  const limited = guard(request);
  if (limited) return limited;

  const token = bookingTokenSchema.safeParse((await ctx.params).token);
  if (!token.success) return notFound();

  const booking = await getBookingByToken(token.data);
  if (!booking) return notFound();
  return json(toPublicBooking(booking));
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/bookings/[token]">) {
  const limited = guard(request);
  if (limited) return limited;

  const token = bookingTokenSchema.safeParse((await ctx.params).token);
  if (!token.success) return notFound();

  const body = await readJson(request);
  if (body === null) return apiError(400, "invalid_body", "Requête illisible.");
  const action = bookingActionSchema.safeParse(body);
  if (!action.success) return validationError(action.error);

  try {
    if (action.data.action === "cancel") await cancelBooking(token.data);
    else await requestBookingChange(token.data, action.data.message);
  } catch (error) {
    if (error instanceof BookingNotFoundError) return notFound();
    if (error instanceof BookingLockedError) return apiError(409, `booking_${error.reason}`, error.message);
    throw error;
  }

  const updated = await getBookingByToken(token.data);
  return updated ? json(toPublicBooking(updated)) : notFound();
}
