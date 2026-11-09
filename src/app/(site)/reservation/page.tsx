import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getBookableCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description: "Choisissez vos prestations, un créneau libre et réservez en ligne, sans créer de compte.",
  alternates: { canonical: "/reservation" },
};

export default function ReservationPage(props: PageProps<"/reservation">) {
  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <header className="max-w-3xl">
          <p className="eyebrow">Réservation en ligne</p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
            Prenez <em>rendez-vous.</em>
          </h1>
        </header>

        <div className="mt-14 lg:mt-20">
          <Suspense fallback={<FlowSkeleton />}>
            <Flow searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function FlowSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="h-3 w-56 rounded-full bg-bone/10" />
      <div className="h-12 w-full max-w-xl rounded-2xl bg-bone/10" />
      <div className="h-40 w-full max-w-2xl rounded-2xl bg-bone/5" />
    </div>
  );
}

async function Flow({ searchParams }: Pick<PageProps<"/reservation">, "searchParams">) {
  const [{ service }, catalog] = await Promise.all([searchParams, getBookableCatalog()]);

  // Pré-sélection depuis une fiche prestation : /reservation?service=<slug>.
  const slug = Array.isArray(service) ? service[0] : service;
  const preselected = catalog.flatMap((category) => category.services).find((candidate) => candidate.slug === slug);

  return <BookingFlow catalog={catalog} initialServiceIds={preselected ? [preselected.id] : []} />;
}
