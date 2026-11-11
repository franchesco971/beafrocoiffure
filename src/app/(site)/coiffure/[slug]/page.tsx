import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Arrow } from "@/components/ui/Arrow";
import { JsonLd } from "@/components/seo/JsonLd";
import { getHairService, getHairServiceSlugs } from "@/lib/catalog";
import { formatDuration, formatPrice, priceLabel } from "@/lib/format";
import { serviceJsonLd } from "@/lib/seo";
import { BOOKING_HREF } from "@/lib/site";
import { getVideoEmbed } from "@/lib/video";

export async function generateStaticParams() {
  const slugs = await getHairServiceSlugs();
  // Cache Components exige au moins un résultat (catalogue vide ou base absente) : le slug factice donne un 404.
  return (slugs.length > 0 ? slugs : ["_"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/coiffure/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getHairService(slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.description || undefined,
    alternates: { canonical: `/coiffure/${slug}` },
  };
}

export default function ServicePage(props: PageProps<"/coiffure/[slug]">) {
  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <Suspense fallback={<ServiceSkeleton />}>
          <ServiceDetails params={props.params} />
        </Suspense>
      </div>
    </section>
  );
}

function ServiceSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="h-3 w-40 rounded-full bg-bone/10" />
      <div className="h-16 w-full max-w-2xl rounded-2xl bg-bone/10 md:h-24" />
      <div className="h-24 w-full max-w-xl rounded-2xl bg-bone/5" />
    </div>
  );
}

async function ServiceDetails({ params }: Pick<PageProps<"/coiffure/[slug]">, "params">) {
  const { slug } = await params;
  const service = await getHairService(slug);
  if (!service) notFound();

  const video = service.videoUrl ? getVideoEmbed(service.videoUrl) : null;

  return (
    <>
      <JsonLd data={serviceJsonLd({ ...service, slug })} />
      <nav aria-label="Fil d’Ariane" className="text-xs uppercase tracking-[0.18em] text-bone-dim">
        <Link href="/" className="transition-colors hover:text-gold">
          Accueil
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/coiffure" className="transition-colors hover:text-gold">
          Coiffure
        </Link>
      </nav>

      <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-12">
        <article className="lg:col-span-7">
          <p className="eyebrow">
            {service.category.name === service.title ? "Espace coiffure" : service.category.name}
          </p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">{service.title}</h1>
          {service.description && <p className="mt-8 max-w-[56ch] text-lg text-bone-dim">{service.description}</p>}

          {video && (
            <div className="mt-12 overflow-hidden rounded-[1.5rem] border border-bone/10 bg-ink-2">
              {video.kind === "iframe" ? (
                <iframe
                  src={video.src}
                  title={`Vidéo : ${service.title}`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              ) : (
                <video controls preload="none" playsInline className="aspect-video w-full">
                  <source src={video.src} />
                </video>
              )}
            </div>
          )}

          {service.conditions && (
            <section className="mt-12">
              <h2 className="eyebrow">Avant de réserver</h2>
              <p className="mt-4 max-w-[56ch] whitespace-pre-line text-bone">{service.conditions}</p>
            </section>
          )}
        </article>

        <aside className="lg:col-span-5">
          <div className="rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-10 lg:sticky lg:top-28">
            <dl className="space-y-5">
              <div className="flex items-baseline justify-between gap-6 border-b border-bone/10 pb-5">
                <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Durée</dt>
                <dd className="display text-3xl text-bone">{formatDuration(service.durationMin)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 border-b border-bone/10 pb-5">
                <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Tarif</dt>
                <dd className="display text-3xl text-bone">{priceLabel(service.priceMode, service.priceCents)}</dd>
              </div>
              {service.depositCents !== null && (
                <div className="flex items-baseline justify-between gap-6 border-b border-bone/10 pb-5">
                  <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">Acompte</dt>
                  <dd className="text-bone">{formatPrice(service.depositCents)}</dd>
                </div>
              )}
            </dl>
            {service.requiresValidation && (
              <p className="mt-5 text-sm text-bone-dim">
                Cette prestation est confirmée par la coiffeuse après votre demande.
              </p>
            )}
            <Link
              href={`${BOOKING_HREF}?service=${encodeURIComponent(slug)}`}
              className="group mt-8 flex items-center justify-center gap-3 rounded-full bg-gold px-7 py-4 text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
            >
              Réserver cette prestation
              <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
