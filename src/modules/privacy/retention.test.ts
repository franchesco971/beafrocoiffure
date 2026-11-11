import { describe, expect, it } from "vitest";
import { DEFAULT_RETENTION_MONTHS, resolveRetentionMonths, retentionCutoff } from "./retention";

describe("retentionCutoff", () => {
  it("recule du nombre de mois demandé", () => {
    expect(retentionCutoff(new Date("2026-11-11T10:00:00Z"), 36).toISOString()).toBe("2023-11-11T10:00:00.000Z");
    expect(retentionCutoff(new Date("2026-01-15T00:00:00Z"), 6).toISOString()).toBe("2025-07-15T00:00:00.000Z");
  });

  it("ne modifie pas la date d'origine", () => {
    const now = new Date("2026-11-11T10:00:00Z");
    retentionCutoff(now, 12);
    expect(now.toISOString()).toBe("2026-11-11T10:00:00.000Z");
  });
});

describe("resolveRetentionMonths", () => {
  it("garde une valeur valide", () => {
    expect(resolveRetentionMonths(24)).toBe(24);
  });

  it.each([null, undefined, "24", 2.5, 5, 121, Number.NaN])("retombe sur la durée par défaut pour %s", (value) => {
    expect(resolveRetentionMonths(value)).toBe(DEFAULT_RETENTION_MONTHS);
  });
});
