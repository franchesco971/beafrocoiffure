import Link from "next/link";
import { Arrow } from "@/components/ui/Arrow";
import { formatDayOfMonth, formatShortMonth, formatTime } from "@/lib/date";
import { formatPrice } from "@/lib/format";

export type EventSummary = {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  location: string | null;
  priceCents: number | null;
  capacity: number | null;
};

export const eventPriceLabel = (priceCents: number | null) =>
  priceCents === null ? "Gratuit" : formatPrice(priceCents);

export function EventList({ events }: { events: EventSummary[] }) {
  return (
    <ul className="border-t border-bone/15">
      {events.map((event) => (
        <li key={event.slug} className="reveal border-b border-bone/15">
          <Link
            href={`/evenements/${event.slug}`}
            className="group relative grid grid-cols-[4.5rem_1fr_auto] items-start gap-x-5 overflow-hidden px-2 py-8 transition-[padding] duration-500 ease-out-expo before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-gold before:transition-transform before:duration-500 before:ease-out-expo hover:px-6 hover:before:scale-y-100 focus-visible:before:scale-y-100 md:grid-cols-[7rem_1fr_auto] md:gap-x-8 md:py-10"
          >
            <span className="relative text-center">
              <span className="display block text-5xl text-gold transition-colors duration-300 group-hover:text-ink md:text-6xl">
                {formatDayOfMonth(event.startsAt)}
              </span>
              <span className="block text-xs uppercase tracking-[0.18em] text-bone-dim transition-colors duration-300 group-hover:text-ink/75">
                {formatShortMonth(event.startsAt)}
              </span>
            </span>
            <span className="relative">
              <span className="display block text-2xl text-bone transition-colors duration-300 group-hover:text-ink md:text-4xl">
                {event.title}
              </span>
              {event.description && (
                <span className="mt-3 line-clamp-2 block max-w-[56ch] text-bone-dim transition-colors duration-300 group-hover:text-ink/75">
                  {event.description}
                </span>
              )}
              <span className="mt-4 block text-xs uppercase tracking-[0.18em] text-bone-dim transition-colors duration-300 group-hover:text-ink/75">
                {formatTime(event.startsAt)}
                {event.location && ` · ${event.location}`} · {eventPriceLabel(event.priceCents)}
                {event.capacity !== null && ` · ${event.capacity} places`}
              </span>
            </span>
            <span className="relative mt-1 grid size-10 place-items-center rounded-full border border-current text-bone transition-[transform,color] duration-500 ease-out-expo group-hover:rotate-45 group-hover:text-ink">
              <Arrow />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
