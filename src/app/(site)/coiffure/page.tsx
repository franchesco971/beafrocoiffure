import type { Metadata } from "next";
import { ServiceList } from "@/components/catalog/ServiceList";
import { getHairCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Prestations coiffure",
  description:
    "Départ de locks, MicroLocks, entretien, soins capillaires, coiffures naturelles : durée, tarif et conseils de chaque prestation.",
  alternates: { canonical: "/coiffure" },
};

export default async function HairServicesPage() {
  const catalog = await getHairCatalog();
  const starts = catalog.map((_, index) =>
    catalog.slice(0, index).reduce((total, category) => total + category.services.length, 1),
  );

  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <header className="max-w-3xl">
          <p className="eyebrow">Espace coiffure</p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
            Toutes nos <em>prestations</em> capillaires.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg text-bone-dim">
            Chaque prestation précise sa durée, son tarif et ses recommandations avant que vous ne réserviez.
          </p>
        </header>

        {catalog.length > 0 ? (
          <div className="mt-16 border-t border-bone/15 lg:mt-24">
            {catalog.map((category, index) => {
              const standalone = category.services.length === 1 && category.services[0].title === category.name;
              return (
                <section key={category.id} aria-label={category.name}>
                  {!standalone && (
                    <h2 className="display px-2 pt-12 text-3xl text-gold md:text-4xl">{category.name}</h2>
                  )}
                  <ServiceList services={category.services} start={starts[index]} />
                </section>
              );
            })}
          </div>
        ) : (
          <p className="mt-16 text-bone-dim">Les prestations seront bientôt en ligne.</p>
        )}
      </div>
    </section>
  );
}
