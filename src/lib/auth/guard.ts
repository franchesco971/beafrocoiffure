import { cache } from "react";
import { redirect } from "next/navigation";
import type { AdminRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Le jeton de session est signé mais non révocable : le compte et son rôle sont relus en base à chaque requête.
export const getAdmin = cache(async () => {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!id) return null;
  return db.adminUser.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
});

/** À appeler au début de chaque page, action serveur ou route d'administration (le proxy ne suffit pas). */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireRole(...roles: AdminRole[]) {
  const admin = await requireAdmin();
  if (!roles.includes(admin.role)) throw new Error("Accès refusé");
  return admin;
}
