import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { saveService } from "../actions";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Nouvelle prestation" };

export default function NewServicePage(props: PageProps<"/admin/prestations/nouvelle">) {
  return (
    <AdminPage title="Nouvelle prestation" back={{ href: "/admin/prestations", label: "Prestations" }}>
      <Suspense fallback={<AdminLoading />}>
        <NewServiceForm searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function NewServiceForm({ searchParams }: Pick<PageProps<"/admin/prestations/nouvelle">, "searchParams">) {
  await requireRole("ADMIN");
  const { categorie } = await searchParams;
  const categories = await db.serviceCategory.findMany({
    select: { id: true, name: true, universe: true },
    orderBy: [{ universe: "asc" }, { position: "asc" }, { id: "asc" }],
  });

  const defaults = {
    title: "",
    slug: "",
    categoryId: typeof categorie === "string" ? categorie : "",
    description: "",
    videoUrl: "",
    priceMode: "QUOTE",
    price: "",
    durationMin: "60",
    deposit: "",
    conditions: "",
    position: "0",
    isActive: "on",
    requiresValidation: "",
  };

  return <ServiceForm action={saveService.bind(null, null)} categories={categories} defaults={defaults} />;
}
