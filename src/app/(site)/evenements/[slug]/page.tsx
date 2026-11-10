import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { eventPriceLabel } from "@/components/events/EventList";
import { formatDay, formatTime } from "@/lib/date";
import { getPublishedEvent, getPublishedEventSlugs } from "@/lib/events";
import { getSeatsLeft } from "@/modules/events/events.service";

export async function generateStaticParams() {
  const slugs = await getPublishedEventSlugs();
  // Cache Components exige au moins un résultat (aucun événement ou base absente) : le slug factice donne un 404.
  return (slugs.length > 0 ? slugs : ["_"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/evenements/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) return {};

  return {
    title: event.title,
    description: event.description || undefined,
    alternates: { canonical: `/evenements/${slug}` },
    openGraph: { title: event.title, description: event.description || undefined, url: `/evenements/${slug}` },
  };
}

export default function EventPage(props: PageProps<"/evenements/[slug]">) {
  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <Suspense fallback={<EventSkeleton />}>
          <EventDetails params={props.params} />
        </Suspense>
      </div>
    </section>
  );
}

function EventSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="h-3 w-40 rounded-full bg-bone/10" />
      <div className="h-16 w-full max-w-2xl rounded-2xl bg-bone/10 md:h-24" />
      <div className="h-24 w-full max-w-xl rounded-2xl bg-bone/5" />
    </div>
  );
}

async function EventDetails({ params }: Pick<PageProps<"/evenements/[slug]">, "params">) {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) notFound();

  return (
    <>
      <nav aria-label="Fil d’Ariane" className="text-xs uppercase tracking-[0.18em] text-bone-dim">
        <Link href="/" className="transition-colors hover:text-gold">
          Accueil
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/evenements" className="transition-colors hover:text-gold">
          Événements
        </Link>
      </nav>

      <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-12">
        <article className="lg:col-span-7">
          <p className="eyebrow">
            <span className="first-letter:uppercase">{formatDay(event.startsAt)}</span>
          </p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">{event.title}</h1>
          {event.description && (
            <p className="mt-8 max-w-[56ch] whitespace-pre-line text-lg text-bone-dim">{event.description}</p>
          )}
        </article>

        <aside className="lg:col-span-5">
          <div className="rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-10 lg:sticky lg:top-28">
            <dl className="space-y-5">
              <div className="flex items-baseline justify-between gap-6 border-b border-bone/10 pb-5">
                <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Heure</dt>
                <dd className="display text-3xl text-bone">{formatTime(event.startsAt)}</dd>
              </div>
              {event.location && (
                <div className="flex items-baseline justify-between gap-6 border-b border-bone/10 pb-5">
                  <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Lieu</dt>
                  <dd className="text-right text-bone">{event.location}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-6 border-b border-bone/10 pb-5">
                <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Tarif</dt>
                <dd className="display text-3xl text-bone">{eventPriceLabel(event.priceCents)}</dd>
              </div>
            </dl>

            <div className="mt-8">
              <Suspense fallback={<p className="text-bone-dim">Chargement des places…</p>}>
                <Registration eventId={event.id} capacity={event.capacity} startsAt={event.startsAt} />
              </Suspense>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

// Places restantes : lues à chaque requête, pas dans le cache.
async function Registration({
  eventId,
  capacity,
  startsAt,
}: {
  eventId: number;
  capacity: number | null;
  startsAt: Date;
}) {
  await connection();
  const seatsLeft = await getSeatsLeft(eventId, capacity);

  if (startsAt <= new Date()) return <p className="text-bone-dim">Cet événement est terminé.</p>;
  if (seatsLeft === 0) return <p className="text-bone">Cet événement est complet.</p>;

  return (
    <>
      {seatsLeft !== null && (
        <p className="mb-6 text-sm text-bone-dim">
          {seatsLeft === 1 ? "Plus qu’une place disponible." : `${seatsLeft} places disponibles.`}
        </p>
      )}
      <EventRegistrationForm eventId={eventId} />
    </>
  );
}
