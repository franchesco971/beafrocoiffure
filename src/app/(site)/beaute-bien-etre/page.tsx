import type { Metadata } from "next";
import Link from "next/link";
import { ScallopRing } from "@/components/brand/ScallopRing";
import { Arrow } from "@/components/ui/Arrow";
import { getWellnessServices } from "@/lib/catalog";
import { getContent } from "@/lib/content";
import { formatDuration, priceLabel } from "@/lib/format";
import { BOOKING_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Beauté & Bien-être",
  description:
    "Conseil sur les produits, séances de testing et accompagnements personnalisés : une conseillère indépendante à vos côtés.",
  alternates: { canonical: "/beaute-bien-etre" },
};

export default async function WellnessPage() {
  const [content, services] = await Promise.all([getContent("page.wellness"), getWellnessServices()]);

  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <header className="max-w-3xl">
          <p className="eyebrow">Espace Beauté &amp; Bien-être</p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
            Choisir, tester, <em>adopter.</em>
          </h1>
          {content.intro && (
            <p className="mt-6 max-w-[52ch] whitespace-pre-line text-lg text-bone-dim">{content.intro}</p>
          )}
        </header>

        {content.offers.length > 0 && (
          <ol className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3 lg:mt-24">
            {content.offers.map((offer, index) => (
              <li key={offer.title} className="reveal border-t border-gold/40 pt-6">
                <span className="display block text-7xl italic text-gold/90">{index + 1}</span>
                <h2 className="display mt-4 text-2xl text-bone md:text-3xl">{offer.title}</h2>
                {offer.text && <p className="mt-3 max-w-[34ch] text-bone-dim">{offer.text}</p>}
              </li>
            ))}
          </ol>
        )}

        {services.length > 0 && (
          <section aria-labelledby="rendez-vous" className="mt-24 lg:mt-32">
            <h2 id="rendez-vous" className="eyebrow">
              Prendre rendez-vous
            </h2>
            <ul className="mt-8 grid gap-6 lg:grid-cols-2">
              {services.map((service) => (
                <li
                  key={service.slug}
                  className="reveal relative flex flex-col rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-10"
                >
                  <ScallopRing bumps={12} strokeWidth={2} className="size-6 text-gold" />
                  <h3 className="display mt-6 text-3xl text-bone md:text-4xl">{service.title}</h3>
                  {service.description && <p className="mt-4 max-w-[46ch] text-bone-dim">{service.description}</p>}
                  <p className="mt-6 text-xs uppercase tracking-[0.18em] text-bone-dim">
                    {formatDuration(service.durationMin)} · {priceLabel(service.priceMode, service.priceCents)}
                  </p>
                  <Link
                    href={`${BOOKING_HREF}?service=${encodeURIComponent(service.slug)}`}
                    className="group mt-8 inline-flex items-center gap-3 self-start border-b border-gold pb-1 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-colors hover:border-bone hover:text-bone"
                  >
                    Réserver
                    <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-16 max-w-[60ch] border-l-2 border-gold pl-5 text-bone-dim">
          Le conseil beauté et bien-être ne constitue pas une prestation médicale : il ne remplace ni un diagnostic, ni
          un traitement, ni l’avis d’un professionnel de santé.
        </p>
      </div>
    </section>
  );
}
