import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Stars } from "@/components/reviews/Stars";
import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { deleteReview, setReviewStatus } from "./actions";

export const metadata: Metadata = { title: "Avis" };

const SECTIONS: { status: ReviewStatus; title: string; empty: string }[] = [
  { status: "PENDING", title: "À modérer", empty: "Aucun avis en attente." },
  { status: "APPROVED", title: "Publiés", empty: "Aucun avis publié." },
  { status: "REJECTED", title: "Refusés", empty: "Aucun avis refusé." },
];

export default function ReviewsAdminPage() {
  return (
    <AdminPage title="Avis">
      <Suspense fallback={<AdminLoading />}>
        <Reviews />
      </Suspense>
    </AdminPage>
  );
}

async function Reviews() {
  await requireAdmin();
  const reviews = await db.review.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 300 });

  return (
    <div className="space-y-12">
      {SECTIONS.map(({ status, title, empty }) => {
        const items = reviews.filter((review) => review.status === status);
        return (
          <section key={status} aria-labelledby={`avis-${status}`}>
            <h2 id={`avis-${status}`} className="display text-3xl text-bone">
              {title} <span className="text-lg text-bone-dim">({items.length})</span>
            </h2>

            {items.length === 0 ? (
              <p className="mt-4 text-bone-dim">{empty}</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {items.map((review) => (
                  <li key={review.id} className="rounded-2xl border border-bone/10 bg-ink-2 p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <p className="text-bone">
                        {review.author} <Stars rating={review.rating} className="ml-2" />
                      </p>
                      <p className="text-sm text-bone-dim">{formatDateTime(review.createdAt)}</p>
                    </div>
                    <p className="mt-3 max-w-[70ch] whitespace-pre-line text-bone">{review.text}</p>

                    <div className="mt-5 flex flex-wrap items-start gap-4">
                      {status !== "APPROVED" && (
                        <form action={setReviewStatus.bind(null, review.id, "APPROVED")}>
                          <Button type="submit" className="h-11 px-5">
                            Publier
                          </Button>
                        </form>
                      )}
                      {status !== "REJECTED" && (
                        <form action={setReviewStatus.bind(null, review.id, "REJECTED")}>
                          <Button type="submit" variant="outline" className="h-11 px-5">
                            Refuser
                          </Button>
                        </form>
                      )}
                      <DeleteForm
                        action={deleteReview.bind(null, review.id)}
                        label="Supprimer"
                        confirmMessage={`Supprimer l'avis de ${review.author} ?`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
