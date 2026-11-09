import { describe, expect, it } from "vitest";
import { parisToUtc } from "@/lib/date";
import { computeSlots, isSlotAvailable, type SlotQuery } from "./availability";
import { DEFAULT_RULES, resolveRules } from "./rules";

const DAY = "2026-11-18"; // mercredi
const hhmm = (minutes: number) => parisToUtc(DAY, minutes);
const at = (hour: number, minute = 0) => hhmm(hour * 60 + minute);
const label = (slot: Date) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(slot);

// Lundi 9 novembre 2026, 10 h à Paris : le mercredi suivant est dans l'horizon et au-delà du délai minimum.
const NOW = new Date("2026-11-09T09:00:00Z");

const query = (overrides: Partial<SlotQuery> = {}): SlotQuery => ({
  date: DAY,
  durationMin: 60,
  rules: DEFAULT_RULES,
  windows: [{ startMin: 9 * 60, endMin: 18 * 60 }],
  busy: [],
  now: NOW,
  ...overrides,
});

describe("computeSlots", () => {
  it("découpe la journée selon le pas et la durée", () => {
    const slots = computeSlots(query());
    expect(slots).toHaveLength(17);
    expect(label(slots[0])).toBe("09:00");
    expect(label(slots.at(-1)!)).toBe("17:00");
  });

  it("exige que la prestation tienne avant la fermeture", () => {
    const slots = computeSlots(query({ durationMin: 90 }));
    expect(label(slots.at(-1)!)).toBe("16:30");
  });

  it("ne propose rien si la prestation est plus longue que la plage", () => {
    expect(computeSlots(query({ durationMin: 10 * 60 }))).toEqual([]);
  });

  it("gère plusieurs plages dans la journée", () => {
    const windows = [
      { startMin: 9 * 60, endMin: 12 * 60 },
      { startMin: 14 * 60, endMin: 18 * 60 },
    ];
    expect(computeSlots(query({ windows, durationMin: 120 })).map(label)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
    ]);
  });

  it("ne propose rien un jour sans horaires", () => {
    expect(computeSlots(query({ windows: [] }))).toEqual([]);
  });

  it("exclut les créneaux dont le bloc chevauche un rendez-vous", () => {
    // Rendez-vous 10 h – 11 h 15 (pause comprise).
    const busy = [{ start: at(10), end: at(11, 15) }];
    const slots = computeSlots(query({ busy })).map(label);
    expect(slots).not.toContain("09:00"); // 9 h + 1 h + 15 min de pause empiète sur 10 h
    expect(slots).toContain("11:30");
    expect(slots.filter((slot) => slot >= "10:00" && slot < "11:30")).toEqual([]);
  });

  it("respecte la pause avant un rendez-vous suivant", () => {
    const busy = [{ start: at(12), end: at(13) }];
    const slots = computeSlots(query({ busy })).map(label);
    expect(slots).toContain("10:30"); // 10 h 30 + 1 h + 15 min = 11 h 45
    expect(slots).not.toContain("11:00"); // 11 h + 1 h + 15 min = 12 h 15 empiète sur 12 h
  });

  it("accepte un créneau qui touche exactement le rendez-vous voisin", () => {
    const busy = [{ start: at(12), end: at(13) }];
    expect(computeSlots(query({ busy, rules: { ...DEFAULT_RULES, bufferMinutes: 0 } })).map(label)).toContain("11:00");
  });

  it("ne propose rien un jour de congé", () => {
    const busy = [{ start: at(0), end: at(24) }];
    expect(computeSlots(query({ busy }))).toEqual([]);
  });

  it("respecte le délai minimum avant réservation", () => {
    // Mardi 17 novembre, 13 h à Paris, délai de 24 h : premier créneau le mercredi à 13 h.
    const now = new Date("2026-11-17T12:00:00Z");
    expect(label(computeSlots(query({ now }))[0])).toBe("13:00");
  });

  it("accepte un créneau exactement au délai minimum", () => {
    const now = new Date(at(9).getTime() - 24 * 3_600_000);
    expect(label(computeSlots(query({ now }))[0])).toBe("09:00");
  });

  it("ne propose rien dans le passé ni au-delà de l'horizon", () => {
    expect(computeSlots(query({ date: "2026-11-08" }))).toEqual([]);
    const rules = { ...DEFAULT_RULES, maxAdvanceDays: 5 };
    expect(computeSlots(query({ rules }))).toEqual([]); // le 18 est à 9 jours
    expect(computeSlots(query({ rules: { ...rules, maxAdvanceDays: 9 } }))).not.toEqual([]);
  });

  it("applique un pas paramétré", () => {
    const rules = { ...DEFAULT_RULES, slotStepMinutes: 15 };
    expect(computeSlots(query({ rules, durationMin: 8 * 60 })).map(label)).toEqual([
      "09:00",
      "09:15",
      "09:30",
      "09:45",
      "10:00",
    ]);
  });
});

describe("isSlotAvailable", () => {
  it("n'accepte que les débuts réellement proposés", () => {
    expect(isSlotAvailable(query(), at(9))).toBe(true);
    expect(isSlotAvailable(query(), at(9, 10))).toBe(false); // hors du pas
    expect(isSlotAvailable(query(), at(18))).toBe(false); // après la fermeture
    expect(isSlotAvailable(query({ busy: [{ start: at(9), end: at(10) }] }), at(9))).toBe(false);
  });
});

describe("resolveRules", () => {
  it("retombe sur les valeurs par défaut", () => {
    expect(resolveRules([])).toEqual(DEFAULT_RULES);
  });

  it("utilise les valeurs enregistrées valides et ignore les autres", () => {
    const rules = resolveRules([
      { key: "booking.buffer_minutes", value: 30 },
      { key: "booking.slot_step_minutes", value: 2 }, // sous le minimum
      { key: "booking.min_notice_hours", value: "48" }, // mauvais type
    ]);
    expect(rules).toEqual({ ...DEFAULT_RULES, bufferMinutes: 30 });
  });
});
