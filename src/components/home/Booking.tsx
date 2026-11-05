import { BOOKING_STEPS } from "@/content/services";

const STAIRS = ["lg:mt-0", "lg:mt-12", "lg:mt-24", "lg:mt-36"] as const;

export function Booking() {
  return (
    <section id="reservation" className="relative isolate overflow-hidden px-5 py-28 lg:px-10 lg:py-44">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 size-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(217,164,65,0.13),transparent_70%)]"
      />

      <div className="mx-auto max-w-[88rem]">
        <div className="reveal max-w-4xl">
          <p className="eyebrow">Réservation en ligne</p>
          <h2 className="display mt-5 text-5xl text-bone md:text-7xl">
            Réservez en quatre <em>gestes.</em>
          </h2>
        </div>

        <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
          {BOOKING_STEPS.map((step, index) => (
            <li
              key={step.title}
              className={`reveal border-t border-gold/40 pt-6 ${STAIRS[index]}`}
            >
              <span className="display block text-7xl italic text-gold/90">{index + 1}</span>
              <h3 className="display mt-4 text-2xl text-bone md:text-3xl">{step.title}</h3>
              <p className="mt-3 max-w-[28ch] text-bone-dim">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="reveal mt-16 max-w-[56ch] border-l-2 border-gold pl-5 text-bone-dim">
          Un imprévu ? Vous pouvez demander une modification ou annuler depuis le lien sécurisé de votre e-mail, selon
          les conditions de la prestation.
        </p>
      </div>
    </section>
  );
}
