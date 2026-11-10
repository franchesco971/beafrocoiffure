import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  AlreadyRegisteredError,
  EventFullError,
  EventUnavailableError,
  getSeatsLeft,
  registerForEvent,
} from "@/modules/events/events.service";

// Nécessite une base migrée (`prisma migrate deploy`) : sinon la suite est ignorée.
const run = process.env.DATABASE_URL ? describe : describe.skip;

// Horloge fictive en 2099 : aucune collision possible avec de vrais événements.
const NOW = new Date("2099-01-01T08:00:00Z");
const RUN_ID = Math.random().toString(36).slice(2, 8);
const SLUG_PREFIX = `test-${RUN_ID}`;
const EMAIL_DOMAIN = "@test.invalid";

let counter = 0;
const person = (email = `participant-${RUN_ID}-${counter++}${EMAIL_DOMAIN}`) => ({ name: "Test Participant", email });

const createEvent = (name: string, data: { capacity: number | null; isPublished?: boolean; startsAt?: Date }) =>
  db.event.create({
    data: {
      slug: `${SLUG_PREFIX}-${name}`,
      title: `Test ${name}`,
      startsAt: data.startsAt ?? new Date("2099-02-01T14:00:00Z"),
      capacity: data.capacity,
      isPublished: data.isPublished ?? true,
    },
    select: { id: true },
  });

run("inscriptions aux événements (base PostgreSQL)", () => {
  afterAll(async () => {
    await db.event.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
    await db.$disconnect();
  });

  it("inscrit un participant et décompte la place", async () => {
    const event = await createEvent("simple", { capacity: 2 });
    await registerForEvent({ eventId: event.id, ...person(), now: NOW });
    expect(await getSeatsLeft(event.id, 2)).toBe(1);
  });

  it("refuse une seconde inscription avec le même e-mail, sans tenir compte de la casse", async () => {
    const event = await createEvent("doublon", { capacity: 5 });
    const email = `Doublon-${RUN_ID}${EMAIL_DOMAIN}`;
    await registerForEvent({ eventId: event.id, ...person(email), now: NOW });
    await expect(
      registerForEvent({ eventId: event.id, ...person(email.toLowerCase()), now: NOW }),
    ).rejects.toBeInstanceOf(AlreadyRegisteredError);
  });

  it("refuse un événement non publié, passé ou inconnu", async () => {
    const draft = await createEvent("brouillon", { capacity: 5, isPublished: false });
    const past = await createEvent("passe", { capacity: 5, startsAt: new Date("2098-12-01T14:00:00Z") });

    for (const eventId of [draft.id, past.id, 2_000_000_000]) {
      await expect(registerForEvent({ eventId, ...person(), now: NOW })).rejects.toBeInstanceOf(EventUnavailableError);
    }
  });

  it("refuse l'inscription quand l'événement est complet, puis libère la place après annulation", async () => {
    const event = await createEvent("complet", { capacity: 1 });
    const { id } = await registerForEvent({ eventId: event.id, ...person(), now: NOW });

    await expect(registerForEvent({ eventId: event.id, ...person(), now: NOW })).rejects.toBeInstanceOf(EventFullError);
    expect(await getSeatsLeft(event.id, 1)).toBe(0);

    await db.eventRegistration.update({ where: { id }, data: { status: "CANCELLED" } });
    await registerForEvent({ eventId: event.id, ...person(), now: NOW });
  });

  it("accepte un nombre illimité d'inscriptions sans capacité", async () => {
    const event = await createEvent("illimite", { capacity: null });
    for (let index = 0; index < 3; index++) await registerForEvent({ eventId: event.id, ...person(), now: NOW });
    expect(await getSeatsLeft(event.id, null)).toBeNull();
  });

  it("huit inscriptions simultanées pour trois places : trois aboutissent", async () => {
    const event = await createEvent("concurrence", { capacity: 3 });

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => registerForEvent({ eventId: event.id, ...person(), now: NOW })),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
    for (const result of results) {
      if (result.status === "rejected") expect(result.reason).toBeInstanceOf(EventFullError);
    }
    expect(await db.eventRegistration.count({ where: { eventId: event.id, status: "CONFIRMED" } })).toBe(3);
  });
});
