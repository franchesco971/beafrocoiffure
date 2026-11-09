import { Check } from "lucide-react";
import { Arrow } from "@/components/ui/Arrow";
import type { BookableCatalog } from "@/lib/catalog";
import { formatDuration, priceLabel } from "@/lib/format";
import { PRIMARY_BUTTON } from "./styles";

const UNIVERSE_LABELS = { HAIR: "Coiffure", WELLNESS: "Beauté & Bien-être" } as const;

export function ServiceStep({
  catalog,
  selected,
  onToggle,
  onNext,
}: {
  catalog: BookableCatalog;
  selected: number[];
  onToggle: (id: number) => void;
  onNext: () => void;
}) {
  if (catalog.length === 0) {
    return <p className="text-bone-dim">Les prestations seront bientôt disponibles à la réservation.</p>;
  }

  return (
    <div>
      <p className="max-w-[52ch] text-bone-dim">
        Choisissez une ou plusieurs prestations : la durée totale détermine les créneaux proposés.
      </p>

      {(["HAIR", "WELLNESS"] as const).map((universe) => {
        const categories = catalog.filter((category) => category.universe === universe);
        if (categories.length === 0) return null;
        return (
          <section key={universe} aria-label={UNIVERSE_LABELS[universe]} className="mt-10">
            <h3 className="eyebrow">{UNIVERSE_LABELS[universe]}</h3>
            {categories.map((category) => {
              const standalone = category.services.length === 1 && category.services[0].title === category.name;
              return (
                <fieldset key={category.id} className="mt-4 min-w-0">
                  <legend className={standalone ? "sr-only" : "display pt-4 text-2xl text-bone"}>
                    {category.name}
                  </legend>
                  <div className="mt-2 border-t border-bone/15">
                    {category.services.map((service) => (
                      <label
                        key={service.id}
                        className="group flex cursor-pointer items-start gap-4 border-b border-bone/15 px-2 py-5 transition-colors hover:bg-bone/[0.03] has-checked:bg-gold/[0.08]"
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={selected.includes(service.id)}
                          onChange={() => onToggle(service.id)}
                        />
                        <span
                          aria-hidden="true"
                          className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-bone/40 text-ink transition-colors group-has-checked:border-gold group-has-checked:bg-gold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold"
                        >
                          <Check
                            className="size-3.5 opacity-0 transition-opacity group-has-checked:opacity-100"
                            strokeWidth={3}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="display block text-xl text-bone md:text-2xl">{service.title}</span>
                          {service.description && (
                            <span className="mt-2 block max-w-[52ch] text-sm text-bone-dim">{service.description}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-right text-xs uppercase leading-relaxed tracking-[0.14em] text-bone-dim">
                          {formatDuration(service.durationMin)}
                          <br />
                          {priceLabel(service.priceMode, service.priceCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </section>
        );
      })}

      <div className="mt-10">
        <button type="button" onClick={onNext} disabled={selected.length === 0} className={PRIMARY_BUTTON}>
          Choisir un créneau
          <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
        </button>
      </div>
    </div>
  );
}
