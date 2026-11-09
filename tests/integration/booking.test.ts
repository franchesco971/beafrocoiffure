import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, dateKeyOf } from "@/lib/date";
import { db } from "@/lib/db";
import {
  BookingLockedError,
  ServicesUnavailableError,
  SlotUnavailableError,
  cancelBooking,
  createBooking,
  getAvailability,
  getBookingByToken,
  isOverlapViolation,
  requestBookingChange,
  type NewBooking,
} from "@/modules/booking/booking.service";

// Nécessite une base migrée et alimentée (`prisma migrate deploy` + `prisma db seed`) : sinon la suite est ignorée.
const run = process.env.DATABASE_URL ? describe : describe.skip;

// Horloge fictive en 2099 : aucune collision possible avec de vrais rendez-vous.
const NOW = new Date("2099-01-01T08:00:00Z");
const EMAIL_DOMAIN = "@test.invalid";
const RUN_ID = Math.random().toString(36).slice(2, 8);

let serviceId: number;
let validationServiceId: number;
let categoryId: number;
let day: string;
let emailCount = 0;

const input = (overrides: Partial<NewBooking> & Pick<NewBooking, "startsAt">): NewBooking => ({
  serviceIds: [serviceId],
  firstName: "Test",
  lastName: "Réservation",
  phone: "0600000000",
  email: `client-${RUN_ID}-${emailCount++}${EMAIL_DOMAIN}`,
  ...overrides,
});

const freeSlots = async (serviceIds = [serviceId]) =>
  (await getAvailability({ serviceIds, from: day, to: day, now: NOW }))[day];

run("réservation (base PostgreSQL)", () => {
  beforeAll(async () => {
    const category = await db.serviceCategory.create({
      data: { name: `Test ${RUN_ID}`, slug: `test-${RUN_ID}`, universe: "HAIR" },
    });
    categoryId = category.id;
    serviceId = (
      await db.service.create({
        data: { categoryId, slug: `test-${RUN_ID}-simple`, title: "Test simple", durationMin: 60 },
      })
    ).id;
    validationServiceId = (
      await db.service.create({
        data: {
          categoryId,
          slug: `test-${RUN_ID}-validation`,
          title: "Test sur validation",
          durationMin: 60,
          requiresValidation: true,
        },
      })
    ).id;

    // Premier jour de 2099 avec des créneaux, d'après les horaires de la base.
    const start = dateKeyOf(NOW);
    for (let offset = 3; offset < 17 && !day; offset++) {
      const candidate = addDays(start, offset);
      const slots = (await getAvailability({ serviceIds: [serviceId], from: candidate, to: candidate, now: NOW }))[
        candidate
      ];
      if (slots.length >= 12) day = candidate;
    }
    if (!day) throw new Error("Aucun horaire de travail en base : lancer `prisma db seed`.");
  });

  afterAll(async () => {
    await db.booking.deleteMany({ where: { client: { email: { endsWith: EMAIL_DOMAIN } } } });
    await db.client.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await db.service.deleteMany({ where: { categoryId } });
    await db.serviceCategory.deleteMany({ where: { id: categoryId } });
    await db.$disconnect();
  });

  it("crée un rendez-vous confirmé et retire le créneau", async () => {
    const slots = await freeSlots();
    const booking = await createBooking(input({ startsAt: slots[0] }), NOW);

    expect(booking.status).toBe("CONFIRMED");
    expect(booking.cancelToken).toMatch(/^[0-9a-f]{64}$/);
    // Bloc occupé : 60 min de prestation + 15 min de pause.
    expect(booking.endsAt.getTime() - booking.startsAt.getTime()).toBe(75 * 60_000);

    const after = await freeSlots();
    expect(after.map((slot) => slot.getTime())).not.toContain(slots[0].getTime());
  });

  it("met la demande en attente si la prestation exige une validation", async () => {
    const slots = await freeSlots([validationServiceId]);
    const booking = await createBooking(input({ serviceIds: [validationServiceId], startsAt: slots.at(-1)! }), NOW);
    expect(booking.status).toBe("PENDING");
  });

  it("refuse un créneau déjà pris", async () => {
    const taken = (await db.booking.findFirstOrThrow({ where: { client: { email: { endsWith: EMAIL_DOMAIN } } } }))
      .startsAt;
    await expect(createBooking(input({ startsAt: taken }), NOW)).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("refuse un début qui n'est pas un créneau proposé", async () => {
    const [first] = await freeSlots();
    const offGrid = new Date(first.getTime() + 7 * 60_000);
    await expect(createBooking(input({ startsAt: offGrid }), NOW)).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("refuse une prestation inconnue", async () => {
    const [first] = await freeSlots();
    await expect(createBooking(input({ serviceIds: [2_000_000_000], startsAt: first }), NOW)).rejects.toBeInstanceOf(
      ServicesUnavailableError,
    );
  });

  it("deux réservations simultanées du même créneau : une seule aboutit", async () => {
    const slots = await freeSlots();
    const target = slots[Math.floor(slots.length / 2)];

    const results = await Promise.allSettled([
      createBooking(input({ startsAt: target }), NOW),
      createBooking(input({ startsAt: target }), NOW),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failure = results.find((result) => result.status === "rejected");
    expect(failure?.reason).toBeInstanceOf(SlotUnavailableError);
    expect(await db.booking.count({ where: { startsAt: target, status: { in: ["PENDING", "CONFIRMED"] } } })).toBe(1);
  });

  it("la contrainte SQL refuse un chevauchement même sans passer par le service", async () => {
    const existing = await db.booking.findFirstOrThrow({
      where: { client: { email: { endsWith: EMAIL_DOMAIN } }, status: "CONFIRMED" },
      select: { startsAt: true, endsAt: true, clientId: true },
    });

    const overlapping = db.booking.create({
      data: {
        clientId: existing.clientId,
        startsAt: new Date(existing.startsAt.getTime() + 30 * 60_000),
        endsAt: new Date(existing.endsAt.getTime() + 30 * 60_000),
      },
    });
    await expect(overlapping).rejects.toSatisfy(isOverlapViolation);
  });

  it("libère le créneau d'un rendez-vous annulé", async () => {
    const [first] = await freeSlots();
    const booking = await createBooking(input({ startsAt: first }), NOW);
    expect((await freeSlots()).map((slot) => slot.getTime())).not.toContain(first.getTime());

    await cancelBooking(booking.cancelToken, NOW);
    await cancelBooking(booking.cancelToken, NOW); // idempotent

    expect((await getBookingByToken(booking.cancelToken, NOW))?.status).toBe("CANCELLED");
    expect((await freeSlots()).map((slot) => slot.getTime())).toContain(first.getTime());
  });

  it("refuse l'annulation et la demande de modification passé le délai limite", async () => {
    const [first] = await freeSlots();
    const booking = await createBooking(input({ startsAt: first }), NOW);
    const tooLate = new Date(first.getTime() - 24 * 3_600_000); // limite : 48 h avant

    expect((await getBookingByToken(booking.cancelToken, tooLate))?.canModify).toBe(false);
    await expect(cancelBooking(booking.cancelToken, tooLate)).rejects.toMatchObject({ reason: "too_late" });
    await expect(requestBookingChange(booking.cancelToken, "Plus tôt SVP", tooLate)).rejects.toBeInstanceOf(
      BookingLockedError,
    );
  });

  it("enregistre une demande de modification dans le délai", async () => {
    const [first] = await freeSlots();
    const booking = await createBooking(input({ startsAt: first }), NOW);

    await requestBookingChange(booking.cancelToken, "Plutôt le jeudi après-midi", NOW);

    const view = await getBookingByToken(booking.cancelToken, NOW);
    expect(view).toMatchObject({ status: "CONFIRMED", canModify: true, changeRequest: "Plutôt le jeudi après-midi" });
  });

  it("ne révèle rien pour un jeton inconnu", async () => {
    expect(await getBookingByToken("0".repeat(64), NOW)).toBeNull();
  });
});
