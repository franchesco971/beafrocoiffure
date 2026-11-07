import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { requireAdmin } from "@/lib/auth/guard";

export default function AdminHome() {
  return (
    <AdminPage title="Tableau de bord">
      <Suspense fallback={<AdminLoading />}>
        <Dashboard />
      </Suspense>
    </AdminPage>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();

  return (
    <>
      <p className="text-bone-dim">Connecté en tant que {admin.email}</p>
      <Link
        href="/admin/prestations"
        className="mt-8 block max-w-sm rounded-2xl border border-bone/10 bg-ink-2 p-6 transition-colors hover:border-gold/50"
      >
        <span className="display block text-2xl text-bone">Prestations</span>
        <span className="mt-2 block text-sm text-bone-dim">Catégories, tarifs, durées et visibilité.</span>
      </Link>
    </>
  );
}
