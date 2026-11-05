import { Arrow } from "@/components/ui/Arrow";
import { HAIR_SERVICES } from "@/content/services";
import { BOOKING_HREF } from "@/lib/site";

export function Services() {
  return (
    <section id="prestations" className="relative bg-ink-2 px-5 py-28 lg:px-10 lg:py-40">
      <div className="mx-auto grid max-w-[88rem] gap-16 lg:grid-cols-12">
        <header className="lg:col-span-4">
          <div className="reveal lg:sticky lg:top-28">
            <p className="eyebrow">Espace coiffure</p>
            <h2 className="display mt-5 text-5xl text-bone md:text-6xl">
              Huit façons de prendre soin de vos <em>cheveux.</em>
            </h2>
            <p className="mt-6 max-w-[34ch] text-bone-dim">
              Chaque prestation précise sa durée, son tarif et ses recommandations avant que vous ne réserviez.
            </p>
          </div>
        </header>

        <ol className="lg:col-span-8">
          {HAIR_SERVICES.map((service, index) => (
            <li key={service.title} className="reveal border-t border-bone/15 last:border-b">
              <a
                href={BOOKING_HREF}
                className="group relative grid grid-cols-[3rem_1fr_auto] items-start gap-x-4 overflow-hidden px-2 py-7 transition-[padding] duration-500 ease-out-expo before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-gold before:transition-transform before:duration-500 before:ease-out-expo hover:px-6 hover:before:scale-y-100 focus-visible:before:scale-y-100 md:grid-cols-[5rem_1fr_auto] md:gap-x-6 md:py-9"
              >
                <span className="display relative text-2xl italic text-gold transition-colors duration-300 group-hover:text-ink md:text-3xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative">
                  <span className="display block text-2xl text-bone transition-colors duration-300 group-hover:text-ink md:text-4xl">
                    {service.title}
                  </span>
                  <span className="mt-3 block max-w-[52ch] text-bone-dim transition-colors duration-300 group-hover:text-ink/75">
                    {service.text}
                  </span>
                </span>
                <span className="relative mt-1 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-bone transition-colors duration-300 group-hover:text-ink">
                  <span className="hidden md:inline">Réserver</span>
                  <span className="grid size-10 place-items-center rounded-full border border-current transition-transform duration-500 ease-out-expo group-hover:rotate-45">
                    <Arrow />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
