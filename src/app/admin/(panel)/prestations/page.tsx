import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { formatDuration, priceLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Prestations" };

const UNIVERSE_LABELS = { HAIR: "Coiffure", WELLNESS: "Beauté & Bien-être" } as const;

export default function ServicesAdminPage() {
  return (
    <AdminPage
      title="Prestations"
      actions={
        <>
          <Link href="/admin/prestations/nouvelle" className={buttonVariants({ className: "h-11 px-5" })}>
            Nouvelle prestation
          </Link>
          <Link
            href="/admin/categories/nouvelle"
            className={buttonVariants({ variant: "outline", className: "h-11 px-5" })}
          >
            Nouvelle catégorie
          </Link>
        </>
      }
    >
      <Suspense fallback={<AdminLoading />}>
        <Catalog />
      </Suspense>
    </AdminPage>
  );
}

async function Catalog() {
  await requireRole("ADMIN");
  const categories = await db.serviceCategory.findMany({
    orderBy: [{ universe: "asc" }, { position: "asc" }, { id: "asc" }],
    include: { services: { orderBy: [{ position: "asc" }, { id: "asc" }] } },
  });

  if (categories.length === 0) return <p className="text-bone-dim">Aucune catégorie pour le moment.</p>;

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section key={category.id} className="rounded-2xl border border-bone/10 bg-ink-2">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-bone/10 px-5 py-4">
            <div>
              <h2 className="display text-2xl text-bone">{category.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-bone-dim">
                {UNIVERSE_LABELS[category.universe]} · ordre {category.position}
              </p>
            </div>
            <div className="flex gap-5 text-sm">
              <Link
                href={`/admin/prestations/nouvelle?categorie=${category.id}`}
                className="text-gold transition-colors hover:text-bone"
              >
                Ajouter une prestation
              </Link>
              <Link
                href={`/admin/categories/${category.id}`}
                className="text-bone-dim transition-colors hover:text-bone"
              >
                Modifier la catégorie
              </Link>
            </div>
          </header>

          {category.services.length > 0 ? (
            <ul className="divide-y divide-bone/10">
              {category.services.map((service) => (
                <li key={service.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4">
                  <div>
                    <p className="text-bone">
                      {service.title}
                      {!service.isActive && (
                        <span className="ml-3 rounded-full border border-bone/20 px-2 py-0.5 text-xs text-bone-dim">
                          Masquée
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-bone-dim">
                      {formatDuration(service.durationMin)} · {priceLabel(service.priceMode, service.priceCents)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/prestations/${service.id}`}
                    className="text-sm text-gold transition-colors hover:text-bone"
                  >
                    Modifier
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-bone-dim">Aucune prestation dans cette catégorie.</p>
          )}
        </section>
      ))}
    </div>
  );
}
