import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// Verrou propre aux inscriptions (celui des réservations est 7305001) : sérialise le contrôle des places.
const lockRegistrations = (client: Prisma.TransactionClient) =>
  client.$executeRaw`SELECT pg_advisory_xact_lock(7305002)`;

export class EventUnavailableError extends Error {
  constructor() {
    super("Cet événement n'est pas ouvert aux inscriptions.");
  }
}

export class EventFullError extends Error {
  constructor() {
    super("Il n'y a plus de place pour cet événement.");
  }
}

export class AlreadyRegisteredError extends Error {
  constructor() {
    super("Cette adresse e-mail est déjà inscrite à cet événement.");
  }
}

export type NewRegistration = {
  eventId: number;
  name: string;
  email: string;
  phone?: string | null;
  /** Instant de référence (tests) : défaut = maintenant. */
  now?: Date;
};

/** Inscrit un participant : événement publié et à venir, place disponible, une inscription par e-mail. */
export async function registerForEvent({ eventId, name, email, phone, now = new Date() }: NewRegistration) {
  return db.$transaction(async (tx) => {
    await lockRegistrations(tx);

    const event = await tx.event.findFirst({
      where: { id: eventId, isPublished: true, startsAt: { gt: now } },
      select: { capacity: true },
    });
    if (!event) throw new EventUnavailableError();

    const confirmed = { eventId, status: "CONFIRMED" } as const;
    const duplicate = await tx.eventRegistration.findFirst({
      where: { ...confirmed, email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) throw new AlreadyRegisteredError();

    if (event.capacity !== null && (await tx.eventRegistration.count({ where: confirmed })) >= event.capacity) {
      throw new EventFullError();
    }

    return tx.eventRegistration.create({
      data: { eventId, name, email, phone: phone || null, consentAt: now },
      select: { id: true },
    });
  });
}

/** Places restantes ; null si les places sont illimitées. */
export async function getSeatsLeft(eventId: number, capacity: number | null) {
  if (capacity === null) return null;
  const taken = await db.eventRegistration.count({ where: { eventId, status: "CONFIRMED" } });
  return Math.max(capacity - taken, 0);
}
