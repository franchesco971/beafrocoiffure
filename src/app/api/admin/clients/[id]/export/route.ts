import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getAdmin } from "@/lib/auth/guard";
import { exportClientData } from "@/modules/privacy/privacy.service";

// Données personnelles complètes d'une cliente (droit d'accès) : réservé aux administrateurs.
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/clients/[id]/export">) {
  const admin = await getAdmin();
  if (!admin) return apiError(401, "unauthorized", "Connexion requise.");
  if (admin.role !== "ADMIN") return apiError(403, "forbidden", "Accès refusé.");

  const id = Number((await ctx.params).id);
  if (!Number.isSafeInteger(id) || id < 1) return apiError(404, "not_found", "Fiche introuvable.");

  const data = await exportClientData(id);
  if (!data) return apiError(404, "not_found", "Fiche introuvable.");
  await audit(admin.id, "CLIENT_EXPORT", "client", id);

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="donnees-cliente-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
