import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { LEGAL_KEYS, LEGAL_PAGES, LEGAL_PLACEHOLDER, WELLNESS_OFFER_SLOTS } from "@/content/pages";
import { requireRole } from "@/lib/auth/guard";
import { getContent } from "@/lib/content";
import { saveContactContent, saveLegalContent, saveWellnessContent } from "./actions";
import { ContactContentForm, LegalContentForm, WellnessContentForm } from "./content-forms";

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
  const [contact, wellness, ...legal] = await Promise.all([
    getContent("site.contact"),
    getContent("page.wellness"),
    ...LEGAL_KEYS.map((key) => getContent(key)),
  ]);

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

      <section aria-labelledby="pages-legales" className="border-t border-bone/10 pt-12">
        <h2 id="pages-legales" className="display text-3xl text-bone">
          Pages légales
        </h2>
        <p className="mb-2 mt-2 text-sm text-bone-dim">
          Textes de départ à compléter puis à faire valider. Format : <code>## Titre</code>, <code>- liste</code>,{" "}
          <code>[texte](lien)</code>, paragraphes séparés par une ligne vide.
        </p>
        <div className="mt-8 space-y-12">
          {LEGAL_KEYS.map((key, index) => (
            <div key={key}>
              <h3 className="display text-2xl text-bone">{LEGAL_PAGES[key].title}</h3>
              <p className="mb-5 mt-1 text-sm text-bone-dim">
                Page publique : {LEGAL_PAGES[key].path}
                {legal[index].body.includes(LEGAL_PLACEHOLDER) && (
                  <span className="ml-2 text-gold">
                    · Des informations sont encore à compléter (repérées par « {LEGAL_PLACEHOLDER} »).
                  </span>
                )}
              </p>
              <LegalContentForm
                action={saveLegalContent.bind(null, key)}
                contentKey={key}
                defaults={{ body: legal[index].body }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
