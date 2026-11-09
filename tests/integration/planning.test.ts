import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { BookingLockedError, BookingNotFoundError, ServicesUnavailableError } from "@/modules/booking/booking.service";
import {
  ClientNotFoundError,
  PlanningConflictError,
  cancelAdminBooking,
  clearChangeRequest,
  createAdminBooking,
  getPlanningEvents,
  moveBooking,
  updateAdminBooking,
  type AdminBookingInput,
} from "@/modules/booking/planning.service";

// Nécessite une base migrée et alimentée : sinon la suite est ignorée.
const run = process.env.DATABASE_URL ? describe : describe.skip;

// Juin 2099 : aucune collision avec les autres suites (2099-01) ni avec de vrais rendez-vous.
const at = (hhmm: string, day = "15") => new Date(`2099-06-${day}T${hhmm}:00Z`);
const RUN_ID = Math.random().toString(36).slice(2, 8);
const LAST_NAME = `Planning-${RUN_ID}`;

let categoryId: number;
let serviceId: number;
let emailCount = 0;

const input = (overrides: Partial<AdminBookingInput> & Pick<AdminBookingInput, "startsAt">): AdminBookingInput => ({
  serviceIds: [serviceId],
  status: "CONFIRMED",
  client: { firstName: "Test", lastName: LAST_NAME, phone: "0600000000", email: null },
  locationType: null,
  address: null,
  notes: null,
  ...overrides,
});

run("planning administrateur (base PostgreSQL)", () => {
  beforeAll(async () => {
    categoryId = (
      await db.serviceCategory.create({
        data: { name: `Planning ${RUN_ID}`, slug: `planning-${RUN_ID}`, universe: "HAIR" },
      })
    ).id;
    serviceId = (
      await db.service.create({
        data: { categoryId, slug: `planning-${RUN_ID}-service`, title: "Test planning", durationMin: 60 },
      })
    ).id;
  });

  afterAll(async () => {
    await db.timeOff.deleteMany({ where: { startsAt: { gte: new Date("2099-06-01T00:00:00Z") } } });
    await db.booking.deleteMany({ where: { client: { lastName: LAST_NAME } } });
    await db.client.deleteMany({ where: { lastName: LAST_NAME } });
    await db.service.deleteMany({ where: { categoryId } });
    await db.serviceCategory.deleteMany({ where: { id: categoryId } });
    await db.$disconnect();
  });

  it("crée un rendez-vous manuel hors horaires de travail, pause comprise", async () => {
    // 06:00 UTC : bien avant l'ouverture, ce que la réservation en ligne refuserait.
    const created = await createAdminBooking(input({ startsAt: at("06:00", "15"), notes: "Appel reçu" }));

    const booking = await db.booking.findUniqueOrThrow({ where: { id: created.id }, include: { items: true } });
    expect(booking).toMatchObject({ source: "ADMIN", status: "CONFIRMED", notes: "Appel reçu" });
    // 60 min de prestation + 15 min de pause.
    expect(booking.endsAt.getTime() - booking.startsAt.getTime()).toBe(75 * 60_000);
    expect(booking.items).toHaveLength(1);
  });

  it("retrouve la cliente par son e-mail et réutilise une fiche existante par identifiant", async () => {
    const email = `planning-${RUN_ID}-${emailCount++}@test.invalid`;
    const contact = { firstName: "Awa", lastName: LAST_NAME, phone: "0611111111", email };
    const first = await createAdminBooking(input({ startsAt: at("08:00", "16"), client: contact }));
    const second = await createAdminBooking(
      input({ startsAt: at("10:00", "16"), client: { ...contact, phone: "0622222222" } }),
    );

    const [a, b] = await Promise.all(
      [first.id, second.id].map((id) => db.booking.findUniqueOrThrow({ where: { id } })),
    );
    expect(a.clientId).toBe(b.clientId);
    expect((await db.client.findUniqueOrThrow({ where: { id: a.clientId } })).phone).toBe("0622222222");

    const third = await createAdminBooking(input({ startsAt: at("12:00", "16"), client: { id: a.clientId } }));
    expect((await db.booking.findUniqueOrThrow({ where: { id: third.id } })).clientId).toBe(a.clientId);
  });

  it("refuse une cliente ou une prestation inconnue", async () => {
    await expect(
      createAdminBooking(input({ startsAt: at("08:00", "17"), client: { id: 2_000_000_000 } })),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
    await expect(
      createAdminBooking(input({ startsAt: at("08:00", "17"), serviceIds: [2_000_000_000] })),
    ).rejects.toBeInstanceOf(ServicesUnavailableError);
  });

  it("refuse un chevauchement avec un autre rendez-vous", async () => {
    await createAdminBooking(input({ startsAt: at("08:00", "18") }));
    await expect(createAdminBooking(input({ startsAt: at("08:30", "18") }))).rejects.toMatchObject({
      reason: "booking",
    });
    // Le bloc de 08:00 court jusqu'à 09:15, pause comprise : 09:15 est libre.
    await expect(createAdminBooking(input({ startsAt: at("09:15", "18") }))).resolves.toBeDefined();
  });

  it("refuse un rendez-vous sur un congé, mais accepte un rendez-vous déjà terminé", async () => {
    await db.timeOff.create({
      data: { startsAt: at("00:00", "19"), endsAt: at("23:00", "19"), type: "HOLIDAY", reason: "test" },
    });

    const blocked = createAdminBooking(input({ startsAt: at("10:00", "19") }));
    await expect(blocked).rejects.toBeInstanceOf(PlanningConflictError);
    await expect(blocked).rejects.toMatchObject({ reason: "time_off" });

    await expect(
      createAdminBooking(input({ startsAt: at("10:00", "19"), status: "COMPLETED" })),
    ).resolves.toBeDefined();
  });

  it("deux créations manuelles simultanées du même créneau : une seule aboutit", async () => {
    const results = await Promise.allSettled([
      createAdminBooking(input({ startsAt: at("08:00", "20") })),
      createAdminBooking(input({ startsAt: at("08:00", "20") })),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")?.reason).toBeInstanceOf(PlanningConflictError);
  });

  it("déplace un rendez-vous en conservant sa durée et clôt la demande de modification", async () => {
    const created = await createAdminBooking(input({ startsAt: at("08:00", "21") }));
    await db.booking.update({
      where: { id: created.id },
      data: { changeRequest: "Plus tard SVP", changeRequestedAt: new Date() },
    });

    await moveBooking(created.id, at("14:00", "21"));

    const moved = await db.booking.findUniqueOrThrow({ where: { id: created.id } });
    expect(moved.startsAt).toEqual(at("14:00", "21"));
    expect(moved.endsAt).toEqual(at("15:15", "21"));
    expect(moved.changeRequest).toBeNull();
  });

  it("refuse un déplacement sur un autre rendez-vous, un congé ou un rendez-vous annulé", async () => {
    const a = await createAdminBooking(input({ startsAt: at("08:00", "22") }));
    const b = await createAdminBooking(input({ startsAt: at("12:00", "22") }));

    await expect(moveBooking(b.id, at("08:30", "22"))).rejects.toMatchObject({ reason: "booking" });
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).startsAt).toEqual(at("12:00", "22"));

    await db.timeOff.create({ data: { startsAt: at("00:00", "23"), endsAt: at("23:00", "23"), type: "BLOCK" } });
    await expect(moveBooking(a.id, at("09:00", "23"))).rejects.toMatchObject({ reason: "time_off" });

    await cancelAdminBooking(a.id);
    await expect(moveBooking(a.id, at("08:00", "24"))).rejects.toBeInstanceOf(BookingLockedError);
    await expect(moveBooking(2_000_000_000, at("08:00", "24"))).rejects.toBeInstanceOf(BookingNotFoundError);
  });

  it("l'annulation libère le créneau ; réactiver un rendez-vous sur un créneau repris est refusé", async () => {
    const original = await createAdminBooking(input({ startsAt: at("08:00", "25") }));
    await cancelAdminBooking(original.id);
    const replacement = await createAdminBooking(input({ startsAt: at("08:00", "25") }));
    expect(replacement.id).not.toBe(original.id);

    await expect(
      updateAdminBooking(original.id, {
        startsAt: at("08:00", "25"),
        status: "CONFIRMED",
        locationType: null,
        address: null,
        notes: null,
      }),
    ).rejects.toMatchObject({ reason: "booking" });
    expect((await db.booking.findUniqueOrThrow({ where: { id: original.id } })).status).toBe("CANCELLED");
  });

  it("modifie les notes et le lieu sans revérifier les congés d'un rendez-vous resté en place", async () => {
    const created = await createAdminBooking(input({ startsAt: at("08:00", "26") }));
    // Congé posé après coup sur un rendez-vous existant : la fiche reste modifiable.
    await db.timeOff.create({ data: { startsAt: at("00:00", "26"), endsAt: at("23:00", "26"), type: "HOLIDAY" } });

    await updateAdminBooking(created.id, {
      startsAt: at("08:00", "26"),
      status: "CONFIRMED",
      locationType: "HOME",
      address: "12 rue des Lilas",
      notes: "Apporter le matériel",
    });

    expect(await db.booking.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({
      locationType: "HOME",
      address: "12 rue des Lilas",
      notes: "Apporter le matériel",
    });
  });

  it("efface une demande de modification et signale un rendez-vous inconnu", async () => {
    const created = await createAdminBooking(input({ startsAt: at("08:00", "27") }));
    await db.booking.update({ where: { id: created.id }, data: { changeRequest: "x", changeRequestedAt: new Date() } });

    await clearChangeRequest(created.id);
    expect((await db.booking.findUniqueOrThrow({ where: { id: created.id } })).changeRequest).toBeNull();
    await expect(clearChangeRequest(2_000_000_000)).rejects.toBeInstanceOf(BookingNotFoundError);
  });

  it("liste les rendez-vous actifs et les congés de la période, sans les annulés", async () => {
    const kept = await createAdminBooking(input({ startsAt: at("08:00", "28") }));
    const cancelled = await createAdminBooking(input({ startsAt: at("12:00", "28") }));
    await cancelAdminBooking(cancelled.id);
    await db.timeOff.create({ data: { startsAt: at("14:00", "28"), endsAt: at("16:00", "28"), type: "BLOCK" } });

    const { bookings, timeOff } = await getPlanningEvents(at("00:00", "28"), at("23:59", "28"));
    expect(bookings.map((booking) => booking.id)).toEqual([kept.id]);
    expect(bookings[0].client.lastName).toBe(LAST_NAME);
    expect(timeOff).toHaveLength(1);
  });
});
