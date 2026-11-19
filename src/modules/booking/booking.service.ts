import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { BookingStatus } from "@/generated/prisma/enums";
import { addDays, dateKeyOf, isoWeekday, minutesToMs, parisToUtc, type DateKey } from "@/lib/date";
import { db } from "@/lib/db";
import { LOCKED_TRANSACTION, LOCK_BOOKINGS, lockRow } from "@/lib/lock";
import { blockMinutes, computeSlots, type Interval, type WorkWindow } from "./availability";
import { RULE_KEYS, resolveRules, type BookingRules } from "./rules";

export type Client = Prisma.TransactionClient;

// Rendez-vous qui occupent le planning.
export const ACTIVE_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED"];

// Une seule écriture de planning à la fois (un seul praticien) ; libéré en fin de transaction.
export const lockBookings = (client: Client) => lockRow(client, LOCK_BOOKINGS);

// 256 bits aléatoires : le lien d'annulation ne doit pas être devinable.
export const newCancelToken = () => randomBytes(32).toString("hex");

export class SlotUnavailableError extends Error {
  constructor() {
    super("Ce créneau n’est plus disponible.");
  }
}

export class ServicesUnavailableError extends Error {
  constructor() {
    super("Une des prestations choisies n’est plus proposée.");
  }
}

export class BookingNotFoundError extends Error {
  constructor() {
    super("Rendez-vous introuvable.");
  }
}

export class BookingLockedError extends Error {
  constructor(readonly reason: "closed" | "too_late") {
    super(
      reason === "closed"
        ? "Ce rendez-vous ne peut plus être modifié."
        : "Le délai pour annuler ou modifier en ligne est dépassé : contactez le salon.",
    );
  }
}

// ───────── Lectures ─────────

export const loadRules = async (client: Client): Promise<BookingRules> =>
  resolveRules(await client.setting.findMany({ where: { key: { in: Object.values(RULE_KEYS) } } }));

export async function loadServices(client: Client, ids: number[]) {
  const services = await client.service.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, durationMin: true, priceCents: true, requiresValidation: true },
  });
  if (services.length !== new Set(ids).size) throw new ServicesUnavailableError();
  return services;
}

const minutesOf = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes();

type Schedule = { windows: Map<number, WorkWindow[]>; busy: Interval[] };

// Horaires hebdomadaires, congés et rendez-vous actifs qui touchent la période [from, to].
async function loadSchedule(client: Client, from: DateKey, to: DateKey): Promise<Schedule> {
  const rangeStart = parisToUtc(from, 0);
  const rangeEnd = parisToUtc(addDays(to, 1), 0);
  const overlap = { startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } };

  const hours = await client.workingHours.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
  const timeOff = await client.timeOff.findMany({ where: overlap, select: { startsAt: true, endsAt: true } });
  const bookings = await client.booking.findMany({
    where: { status: { in: ACTIVE_STATUSES }, ...overlap },
    select: { startsAt: true, endsAt: true },
  });

  const windows = new Map<number, WorkWindow[]>();
  for (const row of hours) {
    const list = windows.get(row.weekday) ?? [];
    list.push({ startMin: minutesOf(row.startTime), endMin: minutesOf(row.endTime) });
    windows.set(row.weekday, list);
  }

  return {
    windows,
    busy: [...timeOff, ...bookings].map(({ startsAt, endsAt }) => ({ start: startsAt, end: endsAt })),
  };
}

function slotsPerDay(
  schedule: Schedule,
  rules: BookingRules,
  durationMin: number,
  from: DateKey,
  to: DateKey,
  now: Date,
) {
  const days: Record<DateKey, Date[]> = {};
  for (let date = from; date <= to; date = addDays(date, 1)) {
    days[date] = computeSlots({
      date,
      durationMin,
      rules,
      windows: schedule.windows.get(isoWeekday(date)) ?? [],
      busy: schedule.busy,
      now,
    });
  }
  return days;
}

export const totalDuration = (services: { durationMin: number }[]) =>
  services.reduce((total, service) => total + service.durationMin, 0);

/** Créneaux libres jour par jour pour les prestations choisies, de `from` à `to` inclus. */
export async function getAvailability(args: { serviceIds: number[]; from: DateKey; to: DateKey; now?: Date }) {
  const { serviceIds, from, to, now = new Date() } = args;
  const services = await loadServices(db, serviceIds);
  const rules = await loadRules(db);
  const schedule = await loadSchedule(db, from, to);
  return slotsPerDay(schedule, rules, totalDuration(services), from, to, now);
}

// ───────── Création ─────────

export type NewBooking = {
  serviceIds: number[];
  startsAt: Date;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes?: string | null;
};

/**
 * Crée un rendez-vous (ou une demande à valider) : le verrou de planning sérialise les écritures et la
 * disponibilité est revalidée dans la transaction (document technique §6.3).
 */
export async function createBooking(input: NewBooking, now = new Date()) {
  return db.$transaction(async (tx) => {
    await lockBookings(tx);

    const services = await loadServices(tx, input.serviceIds);
    const rules = await loadRules(tx);
    const durationMin = totalDuration(services);

    const date = dateKeyOf(input.startsAt);
    const schedule = await loadSchedule(tx, date, date);
    const slots = slotsPerDay(schedule, rules, durationMin, date, date, now)[date];
    if (!slots.some((slot) => slot.getTime() === input.startsAt.getTime())) throw new SlotUnavailableError();

    const contact = { firstName: input.firstName, lastName: input.lastName, phone: input.phone };
    const consentAt = new Date();
    const client = await tx.client.upsert({
      where: { email: input.email },
      update: { ...contact, consentAt },
      create: { ...contact, email: input.email, consentAt },
      select: { id: true },
    });

    return tx.booking.create({
      data: {
        clientId: client.id,
        status: services.some((service) => service.requiresValidation) ? "PENDING" : "CONFIRMED",
        startsAt: input.startsAt,
        endsAt: new Date(input.startsAt.getTime() + minutesToMs(blockMinutes(durationMin, rules))),
        notes: input.notes || null,
        source: "ONLINE",
        cancelToken: newCancelToken(),
        items: {
          create: services.map((service) => ({
            serviceId: service.id,
            durationMin: service.durationMin,
            priceCents: service.priceCents,
          })),
        },
      },
      select: { id: true, status: true, startsAt: true, endsAt: true, cancelToken: true },
    });
  }, LOCKED_TRANSACTION);
}

// ───────── Lien sécurisé (cancel_token) ─────────

export type BookingView = {
  status: BookingStatus;
  startsAt: Date;
  /** Fin de la prestation, pause comprise. */
  endsAt: Date;
  firstName: string;
  services: { title: string; durationMin: number; priceCents: number | null }[];
  changeRequest: string | null;
  /** Annulation et demande de modification encore possibles en ligne. */
  canModify: boolean;
  cancelLimitHours: number;
};

/** Forme sérialisable (dates ISO) renvoyée par l'API et transmise aux composants client. */
export type PublicBooking = Omit<BookingView, "startsAt" | "endsAt"> & { startsAt: string; endsAt: string };

export const toPublicBooking = (view: BookingView): PublicBooking => ({
  ...view,
  startsAt: view.startsAt.toISOString(),
  endsAt: view.endsAt.toISOString(),
});

function modificationBlocker(status: BookingStatus, startsAt: Date, rules: BookingRules, now: Date) {
  if (!ACTIVE_STATUSES.includes(status) || startsAt <= now) return "closed" as const;
  if (startsAt.getTime() - now.getTime() < rules.cancelLimitHours * 3_600_000) return "too_late" as const;
  return null;
}

export async function getBookingByToken(token: string, now = new Date()): Promise<BookingView | null> {
  const booking = await db.booking.findUnique({
    where: { cancelToken: token },
    select: {
      status: true,
      startsAt: true,
      endsAt: true,
      changeRequest: true,
      client: { select: { firstName: true } },
      items: {
        orderBy: { id: "asc" },
        select: { durationMin: true, priceCents: true, service: { select: { title: true } } },
      },
    },
  });
  if (!booking) return null;

  const rules = await loadRules(db);
  return {
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: new Date(booking.startsAt.getTime() + minutesToMs(totalDuration(booking.items))),
    firstName: booking.client.firstName,
    services: booking.items.map((item) => ({
      title: item.service.title,
      durationMin: item.durationMin,
      priceCents: item.priceCents,
    })),
    changeRequest: booking.changeRequest,
    canModify: modificationBlocker(booking.status, booking.startsAt, rules, now) === null,
    cancelLimitHours: rules.cancelLimitHours,
  };
}

async function loadModifiable(token: string, now: Date) {
  const booking = await db.booking.findUnique({
    where: { cancelToken: token },
    select: { id: true, status: true, startsAt: true },
  });
  if (!booking) throw new BookingNotFoundError();
  return { booking, blocker: modificationBlocker(booking.status, booking.startsAt, await loadRules(db), now) };
}

/** Annule le rendez-vous ; sans effet s'il est déjà annulé. */
export async function cancelBooking(token: string, now = new Date()) {
  const { booking, blocker } = await loadModifiable(token, now);
  if (booking.status === "CANCELLED") return;
  if (blocker) throw new BookingLockedError(blocker);

  const { count } = await db.booking.updateMany({
    where: { id: booking.id, status: { in: ACTIVE_STATUSES } },
    data: { status: "CANCELLED" },
  });
  if (count === 0) throw new BookingLockedError("closed");
}

/** Enregistre la demande de modification du client ; l'administrateur la traite. */
export async function requestBookingChange(token: string, message: string, now = new Date()) {
  const { booking, blocker } = await loadModifiable(token, now);
  if (blocker) throw new BookingLockedError(blocker);

  await db.booking.update({ where: { id: booking.id }, data: { changeRequest: message, changeRequestedAt: now } });
}
