import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { getAdmin } from "@/lib/auth/guard";
import { dateKeyOf } from "@/lib/date";
import { bookingsToCsvRows, resolvePeriod, toCsv } from "@/modules/stats/stats";
import { loadPeriodBookings } from "@/modules/stats/stats.service";

// Contient des noms de clients : réservé aux administrateurs (le proxy ne couvre que `/admin`).
export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return apiError(401, "unauthorized", "Connexion requise.");
  if (admin.role !== "ADMIN") return apiError(403, "forbidden", "Accès refusé.");

  const params = request.nextUrl.searchParams;
  const period = resolvePeriod(params.get("from") ?? undefined, params.get("to") ?? undefined, dateKeyOf(new Date()));
  const csv = toCsv(bookingsToCsvRows(await loadPeriodBookings(period)));

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${period.from}_${period.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
