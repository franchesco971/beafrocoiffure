import Link from "next/link";
import { ScallopRing } from "@/components/brand/ScallopRing";
import { Arrow } from "@/components/ui/Arrow";
import { WELLNESS_OFFERS } from "@/content/services";

export function Universes() {
  return (
    <section id="univers" className="relative px-5 pb-28 pt-32 lg:px-10 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <div className="reveal max-w-3xl">
          <p className="eyebrow">Deux univers</p>
          <h2 className="display mt-5 text-5xl text-bone md:text-7xl">
            Une même <em>attention</em>, deux façons de vous la porter.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          <article className="reveal relative overflow-hidden rounded-[2rem] bg-bone p-8 text-ink md:p-12 lg:col-span-7 lg:min-h-[30rem]">
            <ScallopRing
              bumps={40}
              strokeWidth={1.5}
              className="absolute -bottom-24 -right-24 size-[22rem] text-ink/15"
            />
            <p className="display text-8xl italic text-gold-deep md:text-9xl">01</p>
            <h3 className="display mt-6 text-5xl md:text-6xl">Coiffure</h3>
            <p className="mt-5 max-w-[38ch] text-lg text-ink/75">
              Cheveux texturés, locks, MicroLocks et soins capillaires : un savoir-faire précis et une main douce, du
              premier diagnostic à l’entretien.
            </p>
            <Link
              href="/coiffure"
              className="group mt-10 inline-flex items-center gap-3 border-b border-ink/40 pb-1 text-sm font-medium uppercase tracking-[0.18em] transition-colors hover:border-ink"
            >
              Voir les prestations
              <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
            </Link>
          </article>

          <article className="reveal relative rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-12 lg:col-span-5 lg:mt-28">
            <p className="display text-8xl italic text-gold md:text-9xl">02</p>
            <h3 className="display mt-6 text-5xl md:text-6xl">
              Beauté <em>&amp;</em> <span className="whitespace-nowrap">Bien-être</span>
            </h3>
            <p className="mt-5 max-w-[38ch] text-lg text-bone-dim">
              Une conseillère indépendante à vos côtés pour choisir, tester et adopter les bons produits.
            </p>
            <ul className="mt-8 space-y-4">
              {WELLNESS_OFFERS.map((offer) => (
                <li key={offer} className="flex items-center gap-4 border-t border-bone/10 pt-4">
                  <ScallopRing bumps={12} strokeWidth={2} className="size-5 shrink-0 text-gold" />
                  {offer}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-bone-dim">
              Conseil beauté et bien-être : ne constitue pas une prestation médicale.
            </p>
            <Link
              href="/beaute-bien-etre"
              className="group mt-8 inline-flex items-center gap-3 border-b border-gold pb-1 text-sm font-medium uppercase tracking-[0.18em] text-gold transition-colors hover:border-bone hover:text-bone"
            >
              Découvrir l’espace bien-être
              <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
