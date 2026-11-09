import type { PriceMode } from "@/generated/prisma/enums";

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export const priceLabel = (mode: PriceMode, cents: number | null) =>
  mode === "FIXED" && cents !== null ? formatPrice(cents) : "Sur devis";

/** Total d'une sélection : somme des tarifs fixes, « Sur devis » dès qu'une prestation est sur devis. */
export function totalPriceLabel(services: { priceMode: PriceMode; priceCents: number | null }[]) {
  let total = 0;
  for (const { priceMode, priceCents } of services) {
    if (priceMode !== "FIXED" || priceCents === null) return "Sur devis";
    total += priceCents;
  }
  return formatPrice(total);
}
