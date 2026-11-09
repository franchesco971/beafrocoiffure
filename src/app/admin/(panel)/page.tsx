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

const SECTIONS = [
  { href: "/admin/planning", title: "Planning", text: "Calendrier, rendez-vous, horaires, congés et blocages." },
  { href: "/admin/clients", title: "Clients", text: "Coordonnées et historique des rendez-vous." },
  { href: "/admin/prestations", title: "Prestations", text: "Catégories, tarifs, durées et visibilité." },
];

async function Dashboard() {
  const admin = await requireAdmin();

  return (
    <>
      <p className="text-bone-dim">Connecté en tant que {admin.email}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block rounded-2xl border border-bone/10 bg-ink-2 p-6 transition-colors hover:border-gold/50"
          >
            <span className="display block text-2xl text-bone">{section.title}</span>
            <span className="mt-2 block text-sm text-bone-dim">{section.text}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
