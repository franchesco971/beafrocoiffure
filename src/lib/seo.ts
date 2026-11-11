// URL publique du site (production par défaut) ; `SITE_URL` permet de la surcharger (recette, préproduction).
export const SITE_URL = (process.env.SITE_URL ?? "https://www.beafrocoiffure.fr").replace(/\/+$/, "");

export const SITE_NAME = "BeAfro Coiffure";

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

type SalonContact = {
  email: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
};

/** Entreprise locale (Schema.org `HairSalon`) : coordonnées issues des contenus modifiables. */
export function salonJsonLd(contact: SalonContact) {
  const sameAs = [contact.instagram, contact.facebook, contact.tiktok].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": absoluteUrl("/#salon"),
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl("/opengraph-image.png"),
    description: "Coiffure spécialisée cheveux texturés (locks, MicroLocks, soins) et conseil beauté et bien-être.",
    areaServed: "FR",
    ...(contact.email && { email: contact.email }),
    ...(contact.phone && { telephone: contact.phone }),
    ...(contact.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: contact.address.replace(/\s*\n\s*/g, ", "),
        addressCountry: "FR",
      },
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

const SALON_ID = absoluteUrl("/#salon");

/** Prestation de coiffure (Schema.org `Service`) ; le tarif n'est publié que s'il est fixe. */
export function serviceJsonLd(service: {
  slug: string;
  title: string;
  description: string;
  priceMode: "FIXED" | "QUOTE";
  priceCents: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    url: absoluteUrl(`/coiffure/${service.slug}`),
    provider: { "@id": SALON_ID },
    areaServed: "FR",
    ...(service.description && { description: service.description }),
    ...(service.priceMode === "FIXED" &&
      service.priceCents !== null && {
        offers: { "@type": "Offer", priceCurrency: "EUR", price: (service.priceCents / 100).toFixed(2) },
      }),
  };
}

/** Événement avec inscription (Schema.org `Event`). */
export function eventJsonLd(event: {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  location: string | null;
  priceCents: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url: absoluteUrl(`/evenements/${event.slug}`),
    startDate: event.startsAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.location ?? SITE_NAME },
    organizer: { "@id": SALON_ID },
    image: absoluteUrl("/opengraph-image.png"),
    ...(event.description && { description: event.description }),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/evenements/${event.slug}`),
      priceCurrency: "EUR",
      price: ((event.priceCents ?? 0) / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };
}

/** Note moyenne et avis publiés (Schema.org `Review`) rattachés à l'entreprise. */
export function reviewsJsonLd(
  reviews: { author: string; rating: number; text: string; createdAt: Date }[],
  average: number | null,
  count: number,
) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": SALON_ID,
    name: SITE_NAME,
    url: SITE_URL,
    ...(average !== null &&
      count > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(average.toFixed(1)),
          reviewCount: count,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    review: reviews.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.author },
      datePublished: review.createdAt.toISOString().slice(0, 10),
      reviewBody: review.text,
      reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}
