import type { BookableService } from "@/lib/catalog";
import { formatDateTime } from "@/lib/date";
import { formatDuration, totalPriceLabel } from "@/lib/format";

export function Summary({ services, slot }: { services: BookableService[]; slot: string | null }) {
  const duration = services.reduce((total, service) => total + service.durationMin, 0);

  return (
    <aside aria-label="Récapitulatif" className="rounded-[2rem] border border-gold/30 bg-ink-2 p-8 lg:sticky lg:top-28">
      <h2 className="eyebrow">Votre rendez-vous</h2>
      {services.length === 0 ? (
        <p className="mt-6 text-bone-dim">Aucune prestation choisie pour le moment.</p>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {services.map((service) => (
              <li key={service.id} className="flex items-baseline justify-between gap-4">
                <span className="text-bone">{service.title}</span>
                <span className="shrink-0 text-sm text-bone-dim">{formatDuration(service.durationMin)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-4 border-t border-bone/10 pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Durée</dt>
              <dd className="display text-2xl text-bone">{formatDuration(duration)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Tarif</dt>
              <dd className="display text-2xl text-bone">{totalPriceLabel(services)}</dd>
            </div>
            {slot && (
              <div className="border-t border-bone/10 pt-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Date</dt>
                <dd className="mt-2 text-bone first-letter:uppercase">{formatDateTime(slot)}</dd>
              </div>
            )}
          </dl>
        </>
      )}
    </aside>
  );
}
