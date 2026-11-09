import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, json, validationError } from "@/lib/api";
import { getAdmin } from "@/lib/auth/guard";
import { getPlanningEvents } from "@/modules/booking/planning.service";

const MAX_RANGE_MS = 100 * 24 * 3_600_000;

const querySchema = z
  .object({
    start: z.iso.datetime({ offset: true, error: "Début invalide." }),
    end: z.iso.datetime({ offset: true, error: "Fin invalide." }),
  })
  .transform(({ start, end }) => ({ start: new Date(start), end: new Date(end) }))
  .refine(({ start, end }) => end > start && end.getTime() - start.getTime() <= MAX_RANGE_MS, {
    message: "Période invalide (100 jours maximum).",
    path: ["end"],
  });

// Couleurs par statut, résolues par les variables CSS de la charte noir & or.
const STATUS_STYLE = {
  CONFIRMED: { color: "var(--primary)", contrastColor: "var(--primary-foreground)" },
  PENDING: { color: "var(--color-ember)", contrastColor: "var(--color-bone)" },
  COMPLETED: { color: "var(--color-bone-dim)", contrastColor: "var(--color-ink)" },
  NO_SHOW: { color: "var(--color-bone-dim)", contrastColor: "var(--color-ink)", className: "opacity-50" },
  CANCELLED: { color: "var(--color-bone-dim)", contrastColor: "var(--color-ink)" },
} as const;

const TIME_OFF_LABEL = { HOLIDAY: "Congés", BLOCK: "Indisponible" } as const;

// Appelée par le calendrier de l'administration : la session est vérifiée ici, le proxy ne couvre que `/admin`.
export async function GET(request: NextRequest) {
  if (!(await getAdmin())) return apiError(401, "unauthorized", "Connexion requise.");

  const params = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({ start: params.get("start"), end: params.get("end") });
  if (!parsed.success) return validationError(parsed.error);

  const { bookings, timeOff } = await getPlanningEvents(parsed.data.start, parsed.data.end);

  return json([
    ...bookings.map((booking) => {
      const who = `${booking.client.firstName} ${booking.client.lastName.charAt(0)}.`;
      const services = booking.items.map((item) => item.service.title).join(" + ");
      return {
        id: `booking-${booking.id}`,
        title: `${booking.status === "PENDING" ? "À valider · " : ""}${who} — ${services}`,
        start: booking.startsAt.toISOString(),
        end: booking.endsAt.toISOString(),
        url: `/admin/planning/rendez-vous/${booking.id}`,
        startEditable: booking.status === "PENDING" || booking.status === "CONFIRMED",
        extendedProps: { bookingId: booking.id },
        ...STATUS_STYLE[booking.status],
      };
    }),
    ...timeOff.map((off) => ({
      id: `time-off-${off.id}`,
      title: off.reason ? `${TIME_OFF_LABEL[off.type]} — ${off.reason}` : TIME_OFF_LABEL[off.type],
      start: off.startsAt.toISOString(),
      end: off.endsAt.toISOString(),
      display: "background",
      color: "var(--color-ember)",
    })),
  ]);
}
