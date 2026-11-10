import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { WELLNESS_OFFER_SLOTS } from "@/content/pages";
import { requireRole } from "@/lib/auth/guard";
import { getContent } from "@/lib/content";
import { saveContactContent, saveWellnessContent } from "./actions";
import { ContactContentForm, WellnessContentForm } from "./content-forms";

export const metadata: Metadata = { title: "Contenus" };

export default function ContentAdminPage() {
  return (
    <AdminPage title="Contenus">
      <Suspense fallback={<AdminLoading />}>
        <Contents />
      </Suspense>
    </AdminPage>
  );
}

async function Contents() {
  await requireRole("ADMIN");
  const [contact, wellness] = await Promise.all([getContent("site.contact"), getContent("page.wellness")]);

  const wellnessDefaults: Record<string, string> = { intro: wellness.intro };
  for (let slot = 0; slot < WELLNESS_OFFER_SLOTS; slot++) {
    wellnessDefaults[`offerTitle${slot}`] = wellness.offers[slot]?.title ?? "";
    wellnessDefaults[`offerText${slot}`] = wellness.offers[slot]?.text ?? "";
  }

  return (
    <div className="space-y-16">
      <section aria-labelledby="coordonnees">
        <h2 id="coordonnees" className="display text-3xl text-bone">
          Coordonnées et réseaux sociaux
        </h2>
        <p className="mb-6 mt-2 text-sm text-bone-dim">Affichés dans le pied de page et sur la page Contact.</p>
        <ContactContentForm action={saveContactContent} defaults={contact} />
      </section>

      <section aria-labelledby="bien-etre" className="border-t border-bone/10 pt-12">
        <h2 id="bien-etre" className="display text-3xl text-bone">
          Espace Beauté &amp; Bien-être
        </h2>
        <p className="mb-6 mt-2 text-sm text-bone-dim">Introduction et offres de la page Bien-être.</p>
        <WellnessContentForm action={saveWellnessContent} defaults={wellnessDefaults} />
      </section>
    </div>
  );
}
