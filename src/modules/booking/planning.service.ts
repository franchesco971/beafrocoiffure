import type { BookingStatus, LocationType } from "@/generated/prisma/enums";
import { minutesToMs } from "@/lib/date";
import { db } from "@/lib/db";
import { blockMinutes } from "./availability";
import {
  ACTIVE_STATUSES,
  BookingLockedError,
  BookingNotFoundError,
  isOverlapViolation,
  loadRules,
  loadServices,
  lockBookings,
  totalDuration,
  type Client,
} from "./booking.service";

export class PlanningConflictError extends Error {
  constructor(readonly reason: "booking" | "time_off") {
    super(
      reason === "booking"
        ? "Ce créneau chevauche un autre rendez-vous."
        : "Ce créneau chevauche un congé ou un blocage.",
    );
  }
}

export class ClientNotFoundError extends Error {
  constructor() {
    super("Client introuvable.");
  }
}

const isActive = (status: BookingStatus) => ACTIVE_STATUSES.includes(status);

// Même verrou et même contrainte SQL que la réservation en ligne : le planning ne peut jamais être surchargé.
async function inPlanningTransaction<T>(work: (tx: Client) => Promise<T>): Promise<T> {
  try {
    return await db.$transaction(async (tx) => {
      await lockBookings(tx);
      return await work(tx);
    });
  } catch (error) {
    if (isOverlapViolation(error)) throw new PlanningConflictError("booking");
    throw error;
  }
}

async function assertNoTimeOff(tx: Client, start: Date, end: Date) {
  const count = await tx.timeOff.count({ where: { startsAt: { lt: end }, endsAt: { gt: start } } });
  if (count > 0) throw new PlanningConflictError("time_off");
}

// ───────── Lecture du calendrier ─────────

/** Rendez-vous (hors annulés), congés et blocages qui touchent la période [start, end[. */
export async function getPlanningEvents(start: Date, end: Date) {
  const overlap = { startsAt: { lt: end }, endsAt: { gt: start } };
  const [bookings, timeOff] = await Promise.all([
    db.booking.findMany({
      where: { status: { not: "CANCELLED" }, ...overlap },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        client: { select: { firstName: true, lastName: true } },
        items: { orderBy: { id: "asc" }, select: { service: { select: { title: true } } } },
      },
    }),
    db.timeOff.findMany({
      where: overlap,
      orderBy: { startsAt: "asc" },
      select: { id: true, type: true, reason: true, startsAt: true, endsAt: true },
    }),
  ]);
  return { bookings, timeOff };
}

// ───────── Création manuelle ─────────

export type AdminClientInput =
  { id: number } | { firstName: string; lastName: string; phone: string; email: string | null };

export type AdminBookingInput = {
  serviceIds: number[];
  startsAt: Date;
  status: Extract<BookingStatus, "PENDING" | "CONFIRMED" | "COMPLETED">;
  client: AdminClientInput;
  locationType: LocationType | null;
  address: string | null;
  notes: string | null;
};

async function resolveClientId(tx: Client, client: AdminClientInput) {
  if ("id" in client) {
    const found = await tx.client.findUnique({ where: { id: client.id }, select: { id: true } });
    if (!found) throw new ClientNotFoundError();
    return found.id;
  }

  const { email, ...contact } = client;
  // Sans e-mail, impossible de retrouver un client existant : une nouvelle fiche est créée.
  if (!email) return (await tx.client.create({ data: contact, select: { id: true } })).id;
  const saved = await tx.client.upsert({
    where: { email },
    update: contact,
    create: { ...contact, email },
    select: { id: true },
  });
  return saved.id;
}

/**
 * Crée un rendez-vous saisi par l'administrateur (`source = ADMIN`). Les horaires de travail et le délai minimum
 * ne s'appliquent pas, mais le rendez-vous ne peut chevaucher ni un autre rendez-vous ni un congé.
 */
export function createAdminBooking(input: AdminBookingInput) {
  return inPlanningTransaction(async (tx) => {
    const services = await loadServices(tx, input.serviceIds);
    const rules = await loadRules(tx);
    const endsAt = new Date(input.startsAt.getTime() + minutesToMs(blockMinutes(totalDuration(services), rules)));
    if (isActive(input.status)) await assertNoTimeOff(tx, input.startsAt, endsAt);

    return tx.booking.create({
      data: {
        clientId: await resolveClientId(tx, input.client),
        status: input.status,
        startsAt: input.startsAt,
        endsAt,
        locationType: input.locationType,
        address: input.address,
        notes: input.notes,
        source: "ADMIN",
        items: {
          create: services.map((service) => ({
            serviceId: service.id,
            durationMin: service.durationMin,
            priceCents: service.priceCents,
          })),
        },
      },
      select: { id: true, startsAt: true },
    });
  });
}

// ───────── Modification, déplacement, annulation ─────────

export type BookingUpdate = {
  startsAt: Date;
  status: BookingStatus;
  locationType: LocationType | null;
  address: string | null;
  notes: string | null;
};

async function loadBooking(tx: Client, id: number) {
  const booking = await tx.booking.findUnique({
    where: { id },
    select: { status: true, startsAt: true, endsAt: true },
  });
  if (!booking) throw new BookingNotFoundError();
  return booking;
}

// La durée du bloc est conservée ; déplacer le rendez-vous répond à la demande de modification du client.
async function applyUpdate(
  tx: Client,
  id: number,
  current: Awaited<ReturnType<typeof loadBooking>>,
  patch: { startsAt: Date } & Partial<Omit<BookingUpdate, "startsAt">>,
) {
  const status = patch.status ?? current.status;
  const endsAt = new Date(patch.startsAt.getTime() + (current.endsAt.getTime() - current.startsAt.getTime()));
  const moved = patch.startsAt.getTime() !== current.startsAt.getTime();
  const reactivated = isActive(status) && !isActive(current.status);
  if (isActive(status) && (moved || reactivated)) await assertNoTimeOff(tx, patch.startsAt, endsAt);

  return tx.booking.update({
    where: { id },
    data: { ...patch, endsAt, ...(moved && { changeRequest: null, changeRequestedAt: null }) },
    select: { id: true, startsAt: true },
  });
}

export const updateAdminBooking = (id: number, update: BookingUpdate) =>
  inPlanningTransaction(async (tx) => applyUpdate(tx, id, await loadBooking(tx, id), update));

/** Déplace un rendez-vous encore actif (glisser-déposer du calendrier). */
export const moveBooking = (id: number, startsAt: Date) =>
  inPlanningTransaction(async (tx) => {
    const current = await loadBooking(tx, id);
    if (!isActive(current.status)) throw new BookingLockedError("closed");
    return applyUpdate(tx, id, current, { startsAt });
  });

export async function cancelAdminBooking(id: number) {
  const { count } = await db.booking.updateMany({ where: { id }, data: { status: "CANCELLED" } });
  if (count === 0) throw new BookingNotFoundError();
}

export async function clearChangeRequest(id: number) {
  const { count } = await db.booking.updateMany({
    where: { id },
    data: { changeRequest: null, changeRequestedAt: null },
  });
  if (count === 0) throw new BookingNotFoundError();
}
