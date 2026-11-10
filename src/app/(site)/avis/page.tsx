import type { Metadata } from "next";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Stars } from "@/components/reviews/Stars";
import { getPublishedReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Avis clients",
  description: "Les avis de nos clientes sur leur rendez-vous BeAfro Coiffure & Beauté.",
  alternates: { canonical: "/avis" },
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });

export default async function ReviewsPage() {
  const { reviews, average, count } = await getPublishedReviews();

  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <header className="max-w-3xl">
          <p className="eyebrow">Avis clients</p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
            Elles en <em>parlent.</em>
          </h1>
          {average !== null && (
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-bone-dim">
              <Stars rating={average} className="text-2xl" />
              <span>
                {average.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5 · {count} avis
              </span>
            </p>
          )}
        </header>

        <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {reviews.length > 0 ? (
              <ul className="space-y-6">
                {reviews.map((review) => (
                  <li key={review.id} className="reveal rounded-[1.5rem] border border-bone/10 bg-ink-2 p-7">
                    <Stars rating={review.rating} className="text-lg" />
                    <blockquote className="mt-4 max-w-[60ch] whitespace-pre-line text-lg text-bone">
                      {review.text}
                    </blockquote>
                    <p className="mt-5 text-sm text-bone-dim">
                      <span className="text-bone">{review.author}</span> · {dateFormat.format(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-bone-dim">Aucun avis publié pour le moment : soyez la première à en laisser un.</p>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-10 lg:sticky lg:top-28">
              <h2 className="display text-3xl text-bone">Laisser un avis</h2>
              <p className="mb-8 mt-3 text-bone-dim">Votre retour aide d’autres personnes à choisir.</p>
              <ReviewForm />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
