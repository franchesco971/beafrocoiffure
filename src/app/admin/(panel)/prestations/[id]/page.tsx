import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { centsToEuros, flagValue } from "@/lib/admin/forms";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { deleteService, saveService } from "../actions";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Modifier la prestation" };

export default function EditServicePage(props: PageProps<"/admin/prestations/[id]">) {
  return (
    <AdminPage title="Modifier la prestation" back={{ href: "/admin/prestations", label: "Prestations" }}>
      <Suspense fallback={<AdminLoading />}>
        <EditService params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

async function EditService({ params }: Pick<PageProps<"/admin/prestations/[id]">, "params">) {
  await requireRole("ADMIN");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [service, categories] = await Promise.all([
    db.service.findUnique({ where: { id } }),
    db.serviceCategory.findMany({
      select: { id: true, name: true, universe: true },
      orderBy: [{ universe: "asc" }, { position: "asc" }, { id: "asc" }],
    }),
  ]);
  if (!service) notFound();

  const defaults = {
    title: service.title,
    slug: service.slug,
    categoryId: String(service.categoryId),
    description: service.description,
    videoUrl: service.videoUrl ?? "",
    priceMode: service.priceMode,
    price: centsToEuros(service.priceCents),
    durationMin: String(service.durationMin),
    deposit: centsToEuros(service.depositCents),
    conditions: service.conditions ?? "",
    position: String(service.position),
    isActive: flagValue(service.isActive),
    requiresValidation: flagValue(service.requiresValidation),
  };

  return (
    <div className="space-y-14">
      <ServiceForm action={saveService.bind(null, id)} categories={categories} defaults={defaults} />
      <section className="border-t border-bone/10 pt-8">
        <h2 className="eyebrow">Zone sensible</h2>
        <p className="mt-3 max-w-[60ch] text-sm text-bone-dim">
          Une prestation déjà réservée ne peut pas être supprimée : décochez « visible sur le site » pour la retirer.
        </p>
        <div className="mt-5">
          <DeleteForm
            action={deleteService.bind(null, id)}
            label="Supprimer la prestation"
            confirmMessage={`Supprimer définitivement « ${service.title} » ?`}
          />
        </div>
      </section>
    </div>
  );
}
