import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { requireRole } from "@/lib/auth/guard";
import { saveCategory } from "../actions";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "Nouvelle catégorie" };

export default function NewCategoryPage() {
  return (
    <AdminPage title="Nouvelle catégorie" back={{ href: "/admin/prestations", label: "Prestations" }}>
      <Suspense fallback={<AdminLoading />}>
        <NewCategoryForm />
      </Suspense>
    </AdminPage>
  );
}

async function NewCategoryForm() {
  await requireRole("ADMIN");
  const defaults = { name: "", slug: "", universe: "HAIR", position: "0" };
  return <CategoryForm action={saveCategory.bind(null, null)} defaults={defaults} />;
}
