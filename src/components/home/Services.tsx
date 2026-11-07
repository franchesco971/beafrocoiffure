import { ServiceList } from "@/components/catalog/ServiceList";
import { getHairCatalog } from "@/lib/catalog";

const COUNT_WORDS = [
  "Zéro",
  "Une",
  "Deux",
  "Trois",
  "Quatre",
  "Cinq",
  "Six",
  "Sept",
  "Huit",
  "Neuf",
  "Dix",
  "Onze",
  "Douze",
];

export async function Services() {
  const catalog = await getHairCatalog();
  const services = catalog.flatMap((category) => category.services);
  const count = services.length;

  return (
    <section id="prestations" className="relative bg-ink-2 px-5 py-28 lg:px-10 lg:py-40">
      <div className="mx-auto grid max-w-[88rem] gap-16 lg:grid-cols-12">
        <header className="lg:col-span-4">
          <div className="reveal lg:sticky lg:top-28">
            <p className="eyebrow">Espace coiffure</p>
            <h2 className="display mt-5 text-5xl text-bone md:text-6xl">
              {count > 0 ? `${COUNT_WORDS[count] ?? count} façon${count > 1 ? "s" : ""}` : "Des façons"} de prendre soin
              de vos <em>cheveux.</em>
            </h2>
            <p className="mt-6 max-w-[34ch] text-bone-dim">
              Chaque prestation précise sa durée, son tarif et ses recommandations avant que vous ne réserviez.
            </p>
          </div>
        </header>

        <div className="border-t border-bone/15 lg:col-span-8">
          {count > 0 ? (
            <ServiceList services={services} />
          ) : (
            <p className="text-bone-dim">Les prestations seront bientôt en ligne.</p>
          )}
        </div>
      </div>
    </section>
  );
}
