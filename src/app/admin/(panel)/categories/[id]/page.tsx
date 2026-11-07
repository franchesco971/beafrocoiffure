import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { deleteCategory, saveCategory } from "../actions";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "Modifier la catégorie" };

export default function EditCategoryPage(props: PageProps<"/admin/categories/[id]">) {
  return (
    <AdminPage title="Modifier la catégorie" back={{ href: "/admin/prestations", label: "Prestations" }}>
      <Suspense fallback={<AdminLoading />}>
        <EditCategory params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

async function EditCategory({ params }: Pick<PageProps<"/admin/categories/[id]">, "params">) {
  await requireRole("ADMIN");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const category = await db.serviceCategory.findUnique({ where: { id } });
  if (!category) notFound();

  const defaults = {
    name: category.name,
    slug: category.slug,
    universe: category.universe,
    position: String(category.position),
  };

  return (
    <div className="space-y-14">
      <CategoryForm action={saveCategory.bind(null, id)} defaults={defaults} />
      <section className="border-t border-bone/10 pt-8">
        <h2 className="eyebrow">Zone sensible</h2>
        <p className="mt-3 max-w-[60ch] text-sm text-bone-dim">
          Une catégorie ne peut être supprimée que lorsqu&apos;elle ne contient plus aucune prestation.
        </p>
        <div className="mt-5">
          <DeleteForm
            action={deleteCategory.bind(null, id)}
            label="Supprimer la catégorie"
            confirmMessage={`Supprimer définitivement la catégorie « ${category.name} » ?`}
          />
        </div>
      </section>
    </div>
  );
}
