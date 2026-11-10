import { describe, expect, it } from "vitest";
import { bookingsToCsvRows, computeStats, periodPresets, resolvePeriod, toCsv, type StatBooking } from "./stats";

const booking = (overrides: Partial<StatBooking> & Pick<StatBooking, "startsAt">): StatBooking => ({
  endsAt: new Date(overrides.startsAt.getTime() + 3_600_000),
  status: "CONFIRMED",
  source: "ONLINE",
  client: { firstName: "Awa", lastName: "Diallo" },
  items: [{ serviceId: 1, title: "Départ de locks", priceCents: 10_000 }],
  ...overrides,
});

describe("resolvePeriod", () => {
  it("conserve une période valide", () => {
    expect(resolvePeriod("2026-11-03", "2026-11-20", "2026-11-10")).toEqual({ from: "2026-11-03", to: "2026-11-20" });
  });

  it("retombe sur le mois en cours si la période est absente, inversée ou trop longue", () => {
    const month = { from: "2026-11-01", to: "2026-11-30" };
    expect(resolvePeriod(undefined, undefined, "2026-11-10")).toEqual(month);
    expect(resolvePeriod("2026-11-20", "2026-11-03", "2026-11-10")).toEqual(month);
    expect(resolvePeriod("2025-01-01", "2026-11-30", "2026-11-10")).toEqual(month);
    expect(resolvePeriod("2026-02-30", "2026-03-10", "2026-11-10")).toEqual(month);
  });
});

describe("periodPresets", () => {
  it("propose le mois en cours, le mois précédent, 30 jours glissants et l'année", () => {
    const presets = periodPresets("2026-01-15");
    expect(presets.map(({ from, to }) => [from, to])).toEqual([
      ["2026-01-01", "2026-01-31"],
      ["2025-12-01", "2025-12-31"],
      ["2025-12-17", "2026-01-15"],
      ["2026-01-01", "2026-12-31"],
    ]);
  });
});

describe("computeStats", () => {
  const period = { from: "2026-11-01", to: "2026-11-07" };

  it("compte les réservations par jour de Paris, annulations exclues, jours vides compris", () => {
    const stats = computeStats(
      [
        booking({ startsAt: new Date("2026-11-02T09:00:00Z") }),
        booking({ startsAt: new Date("2026-11-02T13:00:00Z") }),
        // 23 h 30 UTC = 0 h 30 le 4 à Paris.
        booking({ startsAt: new Date("2026-11-03T23:30:00Z") }),
        booking({ startsAt: new Date("2026-11-05T09:00:00Z"), status: "CANCELLED" }),
      ],
      period,
    );

    expect(stats.bucket).toBe("day");
    expect(stats.series).toHaveLength(7);
    expect(Object.fromEntries(stats.series.map(({ key, count }) => [key, count]))).toEqual({
      "2026-11-01": 0,
      "2026-11-02": 2,
      "2026-11-03": 0,
      "2026-11-04": 1,
      "2026-11-05": 0,
      "2026-11-06": 0,
      "2026-11-07": 0,
    });
    expect(stats.total).toBe(3);
    expect(stats.cancelled).toBe(1);
  });

  it("sépare le chiffre d'affaires réalisé du prévu et ignore les prestations sur devis", () => {
    const stats = computeStats(
      [
        booking({ startsAt: new Date("2026-11-02T09:00:00Z"), status: "COMPLETED" }),
        booking({ startsAt: new Date("2026-11-03T09:00:00Z"), status: "CONFIRMED" }),
        booking({ startsAt: new Date("2026-11-04T09:00:00Z"), status: "PENDING" }),
        booking({
          startsAt: new Date("2026-11-05T09:00:00Z"),
          status: "COMPLETED",
          items: [{ serviceId: 2, title: "Création de MicroLocks", priceCents: null }],
        }),
        booking({ startsAt: new Date("2026-11-06T09:00:00Z"), status: "NO_SHOW" }),
      ],
      period,
    );

    expect(stats.realizedCents).toBe(10_000);
    expect(stats.expectedCents).toBe(20_000);
    expect(stats.quoteItems).toBe(1);
    expect(stats.noShow).toBe(1);
  });

  it("classe les prestations par nombre de réservations", () => {
    const stats = computeStats(
      [
        booking({
          startsAt: new Date("2026-11-02T09:00:00Z"),
          items: [{ serviceId: 2, title: "Soins capillaires", priceCents: 5_000 }],
        }),
        booking({ startsAt: new Date("2026-11-03T09:00:00Z"), status: "COMPLETED" }),
        booking({ startsAt: new Date("2026-11-04T09:00:00Z"), status: "COMPLETED" }),
      ],
      period,
    );

    expect(stats.topServices.map(({ title, count, realizedCents }) => [title, count, realizedCents])).toEqual([
      ["Départ de locks", 2, 20_000],
      ["Soins capillaires", 1, 0],
    ]);
  });

  it("regroupe par mois au-delà de deux mois", () => {
    const stats = computeStats([booking({ startsAt: new Date("2026-11-02T09:00:00Z") })], {
      from: "2026-09-15",
      to: "2026-12-10",
    });

    expect(stats.bucket).toBe("month");
    expect(stats.series.map(({ key }) => key)).toEqual(["2026-09", "2026-10", "2026-11", "2026-12"]);
    expect(stats.series.find(({ key }) => key === "2026-11")?.count).toBe(1);
  });
});

describe("export CSV", () => {
  it("commence par un BOM, sépare par des points-virgules et protège les guillemets et retours à la ligne", () => {
    expect(
      toCsv([
        ["a", 'b;"c"'],
        ["d\ne", "f"],
      ]),
    ).toBe('\uFEFFa;"b;""c"""\r\n"d\ne";f\r\n');
  });

  it("neutralise les cellules interprétées comme des formules", () => {
    expect(toCsv([["=SOMME(A1)", "+33", "-1", "@x", "normal"]])).toBe("\uFEFF'=SOMME(A1);'+33;'-1;'@x;normal\r\n");
  });

  it("décrit un rendez-vous en heure de Paris, avec un montant en euros", () => {
    const [, row] = bookingsToCsvRows([booking({ startsAt: new Date("2026-11-02T09:00:00Z"), status: "COMPLETED" })]);
    expect(row).toEqual([
      "2026-11-02",
      "10:00",
      "11:00",
      "Awa Diallo",
      "Départ de locks",
      "Terminé",
      "100,00",
      "En ligne",
    ]);
  });

  it("laisse le montant vide pour une prestation sur devis", () => {
    const [, row] = bookingsToCsvRows([
      booking({
        startsAt: new Date("2026-11-02T09:00:00Z"),
        items: [{ serviceId: 2, title: "Création de MicroLocks", priceCents: null }],
      }),
    ]);
    expect(row[6]).toBe("");
  });
});
