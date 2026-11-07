import { Mark } from "@/components/brand/Logo";
import { ScallopRing } from "@/components/brand/ScallopRing";
import { SpinBadge } from "@/components/brand/SpinBadge";
import { Arrow } from "@/components/ui/Arrow";
import { BOOKING_HREF } from "@/lib/site";
import { delay } from "@/lib/style";

const FACTS = ["Réservation en ligne", "Aucun compte à créer", "Confirmation par e-mail"];

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-24 pt-32 lg:pt-36">
      <div
        aria-hidden="true"
        className="absolute -right-[20%] top-[-10%] -z-10 size-[70rem] rounded-full bg-[radial-gradient(closest-side,rgba(217,164,65,0.16),rgba(194,86,43,0.05)_55%,transparent_75%)]"
      />

      <div className="mx-auto grid max-w-[88rem] items-center gap-y-16 px-5 lg:grid-cols-12 lg:px-10">
        <div className="relative z-10 lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <p className="eyebrow fade-up" style={delay(100)}>
            Coiffure afro · Cheveux texturés · Locks
          </p>

          <h1 className="display mt-7 text-[clamp(2.6rem,13vw,5.5rem)] text-bone lg:text-[clamp(5rem,8.8vw,9rem)]">
            <span className="rise-line">
              <span style={delay(200)}>Chaque texture</span>
            </span>
            <span className="rise-line">
              <span style={delay(320)}>mérite sa</span>
            </span>
            <span className="rise-line">
              <span style={delay(440)}>
                <em>couronne.</em>
              </span>
            </span>
          </h1>

          <p className="fade-up mt-9 max-w-[40ch] text-lg text-bone-dim md:text-xl" style={delay(700)}>
            Locks, MicroLocks, soins et coiffures naturelles, pensés pour les cheveux texturés. Et une conseillère
            beauté &amp; bien-être pour aller plus loin.
          </p>

          <div className="fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={delay(850)}>
            <a
              href={BOOKING_HREF}
              className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
            >
              Prendre rendez-vous
              <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
            </a>
            <a
              href="#prestations"
              className="border-b border-bone/40 pb-1 text-sm uppercase tracking-[0.18em] text-bone transition-colors hover:border-gold hover:text-gold"
            >
              Découvrir les prestations
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[32rem] lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:max-w-none lg:translate-x-[9%]">
          <div aria-hidden="true" className="bloom relative aspect-square" style={delay(300)}>
            <ScallopRing bumps={46} strokeWidth={1.4} className="spin-slow absolute inset-0 size-full text-gold" />
            <ScallopRing
              bumps={30}
              strokeWidth={1}
              className="spin-slow-reverse absolute inset-[9%] size-[82%] text-bone/20"
            />
            <div className="absolute inset-[17%] rounded-full bg-[radial-gradient(circle_at_50%_35%,var(--color-ink-3),var(--color-ink)_72%)] ring-1 ring-gold/30" />
            <Mark className="absolute left-1/2 top-1/2 w-[52%] -translate-x-1/2 -translate-y-1/2 text-gold" />
          </div>

          <div
            className="bloom absolute -bottom-6 -left-2 z-20 sm:-left-6 lg:-bottom-4 lg:-left-[14%]"
            style={delay(1000)}
          >
            <SpinBadge href={BOOKING_HREF} />
          </div>
        </div>
      </div>

      <ul className="fade-up mx-auto mt-20 grid max-w-[88rem] gap-px px-5 sm:grid-cols-3 lg:px-10" style={delay(1100)}>
        {FACTS.map((fact) => (
          <li
            key={fact}
            className="flex items-center gap-3 border-t border-bone/15 py-5 text-sm uppercase tracking-[0.2em] text-bone-dim"
          >
            <span className="size-1.5 rounded-full bg-gold" />
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
