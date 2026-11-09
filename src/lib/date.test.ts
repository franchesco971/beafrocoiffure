import { describe, expect, it } from "vitest";
import { addDays, dateKeyOf, isoWeekday, monthBounds, parisToUtc, parseDateKey, shiftMonth } from "./date";

describe("parisToUtc", () => {
  it("applique UTC+1 en hiver", () => {
    expect(parisToUtc("2026-01-15", 9 * 60).toISOString()).toBe("2026-01-15T08:00:00.000Z");
  });

  it("applique UTC+2 en été", () => {
    expect(parisToUtc("2026-07-15", 9 * 60).toISOString()).toBe("2026-07-15T07:00:00.000Z");
  });

  it("suit le passage à l'heure d'été (29 mars 2026)", () => {
    expect(parisToUtc("2026-03-29", 60 + 30).toISOString()).toBe("2026-03-29T00:30:00.000Z");
    expect(parisToUtc("2026-03-29", 9 * 60).toISOString()).toBe("2026-03-29T07:00:00.000Z");
  });

  it("suit le retour à l'heure d'hiver (25 octobre 2026)", () => {
    expect(parisToUtc("2026-10-25", 9 * 60).toISOString()).toBe("2026-10-25T08:00:00.000Z");
  });

  it("refuse une date invalide", () => {
    expect(() => parisToUtc("2026-02-30", 0)).toThrow(RangeError);
  });
});

describe("dateKeyOf", () => {
  it("renvoie le jour de Paris, pas celui d'UTC", () => {
    expect(dateKeyOf(new Date("2026-01-14T23:30:00Z"))).toBe("2026-01-15");
    expect(dateKeyOf(new Date("2026-07-14T22:30:00Z"))).toBe("2026-07-15");
    expect(dateKeyOf(new Date("2026-07-14T21:30:00Z"))).toBe("2026-07-14");
  });
});

describe("calendrier", () => {
  it("ajoute des jours à travers les fins de mois et d'année", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("donne le jour ISO de la semaine", () => {
    expect(isoWeekday("2026-11-09")).toBe(1);
    expect(isoWeekday("2026-11-15")).toBe(7);
  });

  it("valide les dates", () => {
    expect(parseDateKey("2026-02-29")).toBeNull();
    expect(parseDateKey("2026-2-1")).toBeNull();
    expect(parseDateKey("2028-02-29")).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it("borne un mois", () => {
    expect(monthBounds("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthBounds("2026-11")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(monthBounds("2026-13")).toBeNull();
  });

  it("décale un mois", () => {
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
