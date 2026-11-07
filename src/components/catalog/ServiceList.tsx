import Link from "next/link";
import { Arrow } from "@/components/ui/Arrow";
import type { PriceMode } from "@/generated/prisma/enums";
import { formatDuration, priceLabel } from "@/lib/format";

export type ServiceSummary = {
  slug: string;
  title: string;
  description: string;
  durationMin: number;
  priceMode: PriceMode;
  priceCents: number | null;
};

export function ServiceList({ services, start = 1 }: { services: ServiceSummary[]; start?: number }) {
  return (
    <ol>
      {services.map((service, index) => (
        <li key={service.slug} className="reveal border-b border-bone/15">
          <Link
            href={`/coiffure/${service.slug}`}
            className="group relative grid grid-cols-[3rem_1fr_auto] items-start gap-x-4 overflow-hidden px-2 py-7 transition-[padding] duration-500 ease-out-expo before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-gold before:transition-transform before:duration-500 before:ease-out-expo hover:px-6 hover:before:scale-y-100 focus-visible:before:scale-y-100 md:grid-cols-[5rem_1fr_auto] md:gap-x-6 md:py-9"
          >
            <span className="display relative text-2xl italic text-gold transition-colors duration-300 group-hover:text-ink md:text-3xl">
              {String(start + index).padStart(2, "0")}
            </span>
            <span className="relative">
              <span className="display block text-2xl text-bone transition-colors duration-300 group-hover:text-ink md:text-4xl">
                {service.title}
              </span>
              {service.description && (
                <span className="mt-3 block max-w-[52ch] text-bone-dim transition-colors duration-300 group-hover:text-ink/75">
                  {service.description}
                </span>
              )}
              <span className="mt-4 block text-xs uppercase tracking-[0.18em] text-bone-dim transition-colors duration-300 group-hover:text-ink/75">
                {formatDuration(service.durationMin)} · {priceLabel(service.priceMode, service.priceCents)}
              </span>
            </span>
            <span className="relative mt-1 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-bone transition-colors duration-300 group-hover:text-ink">
              <span className="hidden md:inline">Détails</span>
              <span className="grid size-10 place-items-center rounded-full border border-current transition-transform duration-500 ease-out-expo group-hover:rotate-45">
                <Arrow />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
