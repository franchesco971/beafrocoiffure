import { addDays, parisToUtc } from "@/lib/date";
import { db } from "@/lib/db";
import type { Period, StatBooking } from "./stats";

/** Rendez-vous commençant pendant la période (jours de Paris, bornes incluses). */
export async function loadPeriodBookings({ from, to }: Period): Promise<StatBooking[]> {
  const bookings = await db.booking.findMany({
    where: { startsAt: { gte: parisToUtc(from, 0), lt: parisToUtc(addDays(to, 1), 0) } },
    orderBy: { startsAt: "asc" },
    select: {
      startsAt: true,
      endsAt: true,
      status: true,
      source: true,
      client: { select: { firstName: true, lastName: true } },
      items: {
        orderBy: { id: "asc" },
        select: { serviceId: true, priceCents: true, service: { select: { title: true } } },
      },
    },
  });

  return bookings.map(({ items, ...booking }) => ({
    ...booking,
    items: items.map(({ service, ...item }) => ({ ...item, title: service.title })),
  }));
}
