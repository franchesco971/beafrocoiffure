import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  ANONYMOUS_EMAIL,
  ClientHasUpcomingBookingsError,
  ClientNotFoundError,
  anonymizeClient,
  exportClientData,
  expiredClientsWhere,
} from "@/modules/privacy/privacy.service";

// Nécessite une base migrée (`prisma migrate deploy`) : sinon la suite est ignorée.
const run = process.env.DATABASE_URL ? describe : describe.skip;

// Horloge fictive en 2099 : aucune collision avec de vraies données ni avec les autres suites.
const NOW = new Date("2099-01-01T08:00:00Z");
const RUN_ID = Math.random().toString(36).slice(2, 8);
const EMAIL_DOMAIN = `-${RUN_ID}@test.invalid`;

const clientIds: number[] = [];

async function createClient(name: string, createdAt = new Date("2098-01-01T00:00:00Z")) {
  const client = await db.client.create({
    data: {
      firstName: "Test",
      lastName: `Privacy-${RUN_ID}-${name}`,
      phone: "0600000000",
      email: `${name}${EMAIL_DOMAIN}`,
      consentAt: createdAt,
      createdAt,
    },
  });
  clientIds.push(client.id);
  return client;
}

// Un jour distinct par rendez-vous : la contrainte anti-chevauchement est globale.
const createBooking = (clientId: number, startsAt: Date, status: "COMPLETED" | "PENDING" = "COMPLETED") =>
  db.booking.create({
    data: {
      clientId,
      status,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 3_600_000),
      notes: "Allergie au henné",
      address: "12 rue des Test",
      changeRequest: "Plutôt jeudi",
    },
  });

run("données personnelles : export, anonymisation, conservation (base PostgreSQL)", () => {
  afterAll(async () => {
    await db.booking.deleteMany({ where: { clientId: { in: clientIds } } });
    await db.client.deleteMany({ where: { id: { in: clientIds } } });
    await db.contactMessage.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await db.event.deleteMany({ where: { slug: { startsWith: `privacy-${RUN_ID}` } } });
    await db.$disconnect();
  });

  it("exporte la fiche, les rendez-vous, les messages et les inscriptions", async () => {
    const client = await createClient("export");
    await createBooking(client.id, new Date("2098-03-10T10:00:00Z"));
    await db.contactMessage.create({
      data: { name: "Test", email: client.email!, message: "Bonjour, une question.", consentAt: NOW },
    });
    const event = await db.event.create({
      data: { slug: `privacy-${RUN_ID}-export`, title: "Atelier test", startsAt: new Date("2098-05-01T14:00:00Z") },
    });
    await db.eventRegistration.create({
      data: { eventId: event.id, name: "Test", email: client.email!.toUpperCase(), consentAt: NOW },
    });

    const data = await exportClientData(client.id, NOW);

    expect(data?.client.email).toBe(client.email);
    expect(data?.bookings).toHaveLength(1);
    expect(data?.bookings[0]).toMatchObject({ notes: "Allergie au henné", address: "12 rue des Test" });
    expect(data?.contactMessages).toHaveLength(1);
    expect(data?.eventRegistrations).toHaveLength(1);
    expect(data?.eventRegistrations[0].event.title).toBe("Atelier test");
    // Le lien secret d'annulation ne fait pas partie de l'export.
    expect(JSON.stringify(data)).not.toContain("cancelToken");
  });

  it("renvoie null pour une fiche inconnue", async () => {
    expect(await exportClientData(2_000_000_000)).toBeNull();
  });

  it("anonymise la fiche et efface notes, messages et inscriptions en gardant les rendez-vous", async () => {
    const client = await createClient("efface");
    const other = await createClient("autre");
    const booking = await createBooking(client.id, new Date("2098-03-11T10:00:00Z"));
    const otherBooking = await createBooking(other.id, new Date("2098-03-12T10:00:00Z"));
    await db.contactMessage.createMany({
      data: [
        { name: "Test", email: client.email!, message: "À effacer", consentAt: NOW },
        { name: "Test", email: other.email!, message: "À conserver", consentAt: NOW },
      ],
    });
    const event = await db.event.create({
      data: { slug: `privacy-${RUN_ID}-efface`, title: "Atelier", startsAt: new Date("2098-05-02T14:00:00Z") },
    });
    await db.eventRegistration.create({
      data: { eventId: event.id, name: "Test", email: client.email!, phone: "0600000000", consentAt: NOW },
    });

    expect(await anonymizeClient(client.id, NOW)).toBe(true);

    const erased = await db.client.findUniqueOrThrow({ where: { id: client.id } });
    expect(erased).toMatchObject({ phone: "", email: null, consentAt: null });
    expect(erased.anonymizedAt).toEqual(NOW);
    expect(erased.lastName).not.toContain(RUN_ID);

    const kept = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(kept).toMatchObject({ notes: null, address: null, changeRequest: null, clientId: client.id });
    expect(kept.cancelToken).not.toBe(booking.cancelToken);

    expect(await db.contactMessage.count({ where: { email: client.email! } })).toBe(0);
    const registration = await db.eventRegistration.findFirstOrThrow({ where: { eventId: event.id } });
    expect(registration).toMatchObject({ name: "Anonyme", email: ANONYMOUS_EMAIL, phone: null });

    // Les données des autres clientes ne sont pas touchées.
    expect(await db.contactMessage.count({ where: { email: other.email! } })).toBe(1);
    expect((await db.booking.findUniqueOrThrow({ where: { id: otherBooking.id } })).notes).toBe("Allergie au henné");
  });

  it("est sans effet sur une fiche déjà anonymisée", async () => {
    const client = await createClient("deja");
    expect(await anonymizeClient(client.id, NOW)).toBe(true);
    expect(await anonymizeClient(client.id, NOW)).toBe(false);
  });

  it("refuse d'anonymiser une cliente qui a un rendez-vous à venir", async () => {
    const client = await createClient("avenir");
    await createBooking(client.id, new Date("2099-09-20T10:00:00Z"), "PENDING");

    await expect(anonymizeClient(client.id, NOW)).rejects.toBeInstanceOf(ClientHasUpcomingBookingsError);
    expect((await db.client.findUniqueOrThrow({ where: { id: client.id } })).email).toBe(client.email);
  });

  it("refuse une fiche inconnue", async () => {
    await expect(anonymizeClient(2_000_000_000, NOW)).rejects.toBeInstanceOf(ClientNotFoundError);
  });

  it("repère les fiches sans activité depuis la date limite, et elles seulement", async () => {
    const cutoff = new Date("2095-01-01T00:00:00Z");
    const longAgo = new Date("2090-01-01T00:00:00Z");

    const dormant = await createClient("dormante", longAgo);
    await createBooking(dormant.id, new Date("2090-06-01T10:00:00Z"));
    const returning = await createClient("revenue", longAgo);
    await createBooking(returning.id, new Date("2098-06-02T10:00:00Z"));
    const recent = await createClient("recente");
    const neverBooked = await createClient("sans-rdv", longAgo);
    const anonymized = await createClient("anonyme", longAgo);
    await db.client.update({ where: { id: anonymized.id }, data: { anonymizedAt: longAgo } });

    const found = await db.client.findMany({
      where: { ...expiredClientsWhere(cutoff), id: { in: clientIds } },
      select: { id: true },
    });

    expect(found.map(({ id }) => id)).toEqual(expect.arrayContaining([dormant.id, neverBooked.id]));
    expect(found.map(({ id }) => id)).not.toContain(returning.id);
    expect(found.map(({ id }) => id)).not.toContain(recent.id);
    expect(found.map(({ id }) => id)).not.toContain(anonymized.id);
  });
});
