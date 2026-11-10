import type { BookingSource, BookingStatus } from "@/generated/prisma/enums";
import { addDays, dateKeyOf, monthBounds, parseDateKey, shiftMonth, timeKeyOf, type DateKey } from "@/lib/date";

export const MAX_PERIOD_DAYS = 366;
/** Au-delà, la série est regroupée par mois plutôt que par jour. */
const DAILY_MAX_DAYS = 62;

export type Period = { from: DateKey; to: DateKey };

export type StatBooking = {
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  source: BookingSource;
  client: { firstName: string; lastName: string };
  items: { serviceId: number; title: string; priceCents: number | null }[];
};

const daysBetween = (from: DateKey, to: DateKey) => {
  const a = parseDateKey(from)!;
  const b = parseDateKey(to)!;
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000) + 1;
};

/** Période demandée si elle est valide (ordre, 366 jours maximum), sinon le mois de `today`. */
export function resolvePeriod(from: string | undefined, to: string | undefined, today: DateKey): Period {
  if (from && to && parseDateKey(from) && parseDateKey(to)) {
    const days = daysBetween(from, to);
    if (days >= 1 && days <= MAX_PERIOD_DAYS) return { from, to };
  }
  return monthBounds(today.slice(0, 7))!;
}

/** Raccourcis de la page : mois en cours, mois précédent, 30 derniers jours, année en cours. */
export function periodPresets(today: DateKey) {
  const month = today.slice(0, 7);
  const previous = shiftMonth(month, -1);
  return [
    { label: "Ce mois-ci", ...monthBounds(month)! },
    { label: "Mois précédent", ...monthBounds(previous)! },
    { label: "30 derniers jours", from: addDays(today, -29), to: today },
    { label: "Cette année", from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` },
  ];
}

export type Stats = {
  /** Réservations hors annulations. */
  total: number;
  cancelled: number;
  noShow: number;
  /** Prestations terminées (tarifs fixes uniquement). */
  realizedCents: number;
  /** Rendez-vous à venir ou à confirmer (tarifs fixes uniquement). */
  expectedCents: number;
  /** Prestations sur devis : exclues des montants. */
  quoteItems: number;
  topServices: { serviceId: number; title: string; count: number; realizedCents: number }[];
  bucket: "day" | "month";
  series: { key: string; count: number }[];
};

const priceOf = (booking: StatBooking) => booking.items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);

function seriesKeys(period: Period, bucket: Stats["bucket"]) {
  if (bucket === "day") {
    return Array.from({ length: daysBetween(period.from, period.to) }, (_, index) => addDays(period.from, index));
  }
  const keys: string[] = [];
  for (let month = period.from.slice(0, 7); month <= period.to.slice(0, 7); month = shiftMonth(month, 1)) {
    keys.push(month);
  }
  return keys;
}

export function computeStats(bookings: StatBooking[], period: Period): Stats {
  const bucket = daysBetween(period.from, period.to) <= DAILY_MAX_DAYS ? "day" : "month";
  const counts = new Map(seriesKeys(period, bucket).map((key) => [key, 0]));
  const services = new Map<number, Stats["topServices"][number]>();

  const stats: Stats = {
    total: 0,
    cancelled: 0,
    noShow: 0,
    realizedCents: 0,
    expectedCents: 0,
    quoteItems: 0,
    topServices: [],
    bucket,
    series: [],
  };

  for (const booking of bookings) {
    if (booking.status === "CANCELLED") {
      stats.cancelled++;
      continue;
    }
    stats.total++;
    if (booking.status === "NO_SHOW") stats.noShow++;
    if (booking.status === "COMPLETED") stats.realizedCents += priceOf(booking);
    if (booking.status === "PENDING" || booking.status === "CONFIRMED") stats.expectedCents += priceOf(booking);

    const key = bucket === "day" ? dateKeyOf(booking.startsAt) : dateKeyOf(booking.startsAt).slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);

    for (const item of booking.items) {
      if (item.priceCents === null) stats.quoteItems++;
      const entry = services.get(item.serviceId) ?? {
        serviceId: item.serviceId,
        title: item.title,
        count: 0,
        realizedCents: 0,
      };
      entry.count++;
      if (booking.status === "COMPLETED") entry.realizedCents += item.priceCents ?? 0;
      services.set(item.serviceId, entry);
    }
  }

  stats.topServices = [...services.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "fr"));
  stats.series = [...counts].map(([key, count]) => ({ key, count }));
  return stats;
}

// Les tableurs interprètent une cellule commençant par ces caractères comme une formule.
const FORMULA_START = /^[=+\-@\t\r]/;

const csvCell = (value: string) => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

/** CSV pour Excel en français : séparateur « ; », BOM UTF-8, lignes terminées par CRLF. */
export const toCsv = (rows: string[][]) => `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}\r\n`;

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "À valider",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  NO_SHOW: "Absent",
};

const SOURCE_LABELS: Record<BookingSource, string> = { ONLINE: "En ligne", ADMIN: "Administration" };

export function bookingsToCsvRows(bookings: StatBooking[]) {
  const header = ["Date", "Début", "Fin", "Client", "Prestations", "Statut", "Montant (€)", "Origine"];
  const rows = bookings.map((booking) => {
    const fixed = booking.items.filter((item) => item.priceCents !== null);
    const amount = fixed.length > 0 ? (priceOf(booking) / 100).toFixed(2).replace(".", ",") : "";
    return [
      dateKeyOf(booking.startsAt),
      timeKeyOf(booking.startsAt),
      timeKeyOf(booking.endsAt),
      `${booking.client.firstName} ${booking.client.lastName}`,
      booking.items.map((item) => item.title).join(" + "),
      STATUS_LABELS[booking.status],
      amount,
      SOURCE_LABELS[booking.source],
    ];
  });
  return [header, ...rows];
}
