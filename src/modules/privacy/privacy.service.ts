import type { Prisma } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getRetentionMonths } from "@/lib/settings";
import { ACTIVE_STATUSES } from "@/modules/booking/booking.service";
import { retentionCutoff } from "./retention";

// Valeurs de remplacement : les rendez-vous restent comptés (statistiques, comptabilité) sans identifier la personne.
export const ANONYMOUS_FIRST_NAME = "Client";
export const ANONYMOUS_LAST_NAME = "anonymisé";
export const ANONYMOUS_NAME = "Anonyme";
export const ANONYMOUS_EMAIL = "anonyme@anonyme.invalid";

export class ClientNotFoundError extends Error {
  constructor() {
    super("Fiche introuvable.");
  }
}

export class ClientHasUpcomingBookingsError extends Error {
  constructor() {
    super("Cette cliente a des rendez-vous à venir : annulez-les avant de l’anonymiser.");
  }
}

const byEmail = (email: string) => ({ equals: email, mode: "insensitive" as const });

// ───────── Export (droit d'accès et portabilité) ─────────

/** Toutes les données rattachées à une cliente (fiche, rendez-vous, messages, inscriptions) ; null si inconnue. */
export async function exportClientData(clientId: number, now = new Date()) {
  const client = await db.client.findUnique({
    where: { id: clientId },
    include: {
      bookings: {
        orderBy: { startsAt: "asc" },
        include: { items: { orderBy: { id: "asc" }, include: { service: { select: { title: true } } } } },
      },
    },
  });
  if (!client) return null;

  const [contactMessages, eventRegistrations] = client.email
    ? await Promise.all([
        db.contactMessage.findMany({
          where: { email: byEmail(client.email) },
          orderBy: { createdAt: "asc" },
          select: { name: true, email: true, message: true, consentAt: true, createdAt: true },
        }),
        db.eventRegistration.findMany({
          where: { email: byEmail(client.email) },
          orderBy: { createdAt: "asc" },
          select: {
            name: true,
            email: true,
            phone: true,
            status: true,
            consentAt: true,
            createdAt: true,
            event: { select: { title: true, startsAt: true } },
          },
        }),
      ])
    : [[], []];

  return {
    exportedAt: now,
    client: {
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email,
      consentAt: client.consentAt,
      anonymizedAt: client.anonymizedAt,
      createdAt: client.createdAt,
    },
    bookings: client.bookings.map((booking) => ({
      status: booking.status,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      source: booking.source,
      locationType: booking.locationType,
      address: booking.address,
      notes: booking.notes,
      changeRequest: booking.changeRequest,
      createdAt: booking.createdAt,
      services: booking.items.map((item) => ({
        title: item.service.title,
        durationMin: item.durationMin,
        priceCents: item.priceCents,
      })),
    })),
    contactMessages,
    eventRegistrations,
  };
}

// ───────── Anonymisation (droit à l'effacement) ─────────

async function anonymizeInTransaction(tx: Prisma.TransactionClient, clientId: number, now: Date) {
  const client = await tx.client.findUnique({
    where: { id: clientId },
    select: { email: true, anonymizedAt: true },
  });
  if (!client) throw new ClientNotFoundError();
  if (client.anonymizedAt) return false;

  const upcoming = await tx.booking.count({
    where: { clientId, status: { in: ACTIVE_STATUSES }, endsAt: { gt: now } },
  });
  if (upcoming > 0) throw new ClientHasUpcomingBookingsError();

  if (client.email) {
    await tx.contactMessage.deleteMany({ where: { email: byEmail(client.email) } });

    const registrations = await tx.eventRegistration.findMany({
      where: { email: byEmail(client.email) },
      select: { id: true },
    });
    const ids = registrations.map(({ id }) => id);
    await tx.notification.updateMany({
      where: { eventRegistrationId: { in: ids } },
      data: { recipient: ANONYMOUS_EMAIL },
    });
    await tx.eventRegistration.updateMany({
      where: { id: { in: ids } },
      data: { name: ANONYMOUS_NAME, email: ANONYMOUS_EMAIL, phone: null },
    });
  }

  await tx.notification.updateMany({ where: { booking: { clientId } }, data: { recipient: ANONYMOUS_EMAIL } });
  await tx.booking.updateMany({ where: { clientId }, data: { notes: null, address: null, changeRequest: null } });
  // Les anciens liens d'annulation ne doivent plus donner accès à la moindre information.
  await tx.$executeRaw`
    UPDATE booking
    SET cancel_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
    WHERE client_id = ${clientId}`;
  await tx.client.update({
    where: { id: clientId },
    data: {
      firstName: ANONYMOUS_FIRST_NAME,
      lastName: ANONYMOUS_LAST_NAME,
      phone: "",
      email: null,
      consentAt: null,
      anonymizedAt: now,
    },
  });
  return true;
}

/** Efface les données identifiantes d'une cliente en gardant ses rendez-vous ; `false` si déjà anonymisée. */
export async function anonymizeClient(clientId: number, now = new Date()) {
  return db.$transaction((tx) => anonymizeInTransaction(tx, clientId, now));
}

// ───────── Durée de conservation ─────────

// Aucune activité (rendez-vous, même annulé, ni création de la fiche) depuis la date limite.
export const expiredClientsWhere = (cutoff: Date): Prisma.ClientWhereInput => ({
  anonymizedAt: null,
  createdAt: { lt: cutoff },
  bookings: { none: { startsAt: { gte: cutoff } } },
});

export async function countExpiredData(now = new Date()) {
  const cutoff = retentionCutoff(now, await getRetentionMonths());
  const [clients, messages, registrations] = await Promise.all([
    db.client.count({ where: expiredClientsWhere(cutoff) }),
    db.contactMessage.count({ where: { createdAt: { lt: cutoff } } }),
    db.eventRegistration.count({
      where: { email: { not: ANONYMOUS_EMAIL }, event: { startsAt: { lt: cutoff } } },
    }),
  ]);
  return { clients, messages, registrations };
}

/** Anonymise les fiches inactives et supprime les messages et inscriptions arrivés au terme de la conservation. */
export async function purgeExpiredData(now = new Date(), adminId: number | null = null) {
  const cutoff = retentionCutoff(now, await getRetentionMonths());

  const expired = await db.client.findMany({ where: expiredClientsWhere(cutoff), select: { id: true } });
  let clients = 0;
  for (const { id } of expired) {
    if (await anonymizeClient(id, now)) clients++;
  }

  const { count: messages } = await db.contactMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });

  const oldRegistrations = { email: { not: ANONYMOUS_EMAIL }, event: { startsAt: { lt: cutoff } } };
  await db.notification.updateMany({
    where: { eventRegistration: oldRegistrations },
    data: { recipient: ANONYMOUS_EMAIL },
  });
  const { count: registrations } = await db.eventRegistration.updateMany({
    where: oldRegistrations,
    data: { name: ANONYMOUS_NAME, email: ANONYMOUS_EMAIL, phone: null },
  });

  const total = { clients, messages, registrations };
  if (clients + messages + registrations > 0) await audit(adminId, "RETENTION_PURGE", "privacy", JSON.stringify(total));
  return total;
}
