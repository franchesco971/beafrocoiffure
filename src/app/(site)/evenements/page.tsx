import type { Metadata } from "next";
import { EventList } from "@/components/events/EventList";
import { getUpcomingEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Événements",
  description: "Ateliers, rencontres et temps forts BeAfro Coiffure & Beauté : programme et inscriptions.",
  alternates: { canonical: "/evenements" },
};

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <header className="max-w-3xl">
          <p className="eyebrow">Événements</p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
            Se retrouver, <em>apprendre,</em> partager.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg text-bone-dim">
            Ateliers et rencontres autour des cheveux texturés, de la beauté et du bien-être : inscrivez-vous en
            quelques secondes.
          </p>
        </header>

        <div className="mt-16 lg:mt-24">
          {events.length > 0 ? (
            <EventList events={events} />
          ) : (
            <p className="text-bone-dim">Aucun événement n’est programmé pour le moment. Revenez bientôt.</p>
          )}
        </div>
      </div>
    </section>
  );
}
