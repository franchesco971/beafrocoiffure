import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Événements" };

export default function EventsAdminPage() {
  return (
    <AdminPage
      title="Événements"
      actions={
        <Link href="/admin/evenements/nouveau" className={buttonVariants({ className: "h-11 px-5" })}>
          Nouvel événement
        </Link>
      }
    >
      <Suspense fallback={<AdminLoading />}>
        <Events />
      </Suspense>
    </AdminPage>
  );
}

async function Events() {
  await requireAdmin();
  const events = await db.event.findMany({
    orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
  });

  if (events.length === 0) return <p className="text-bone-dim">Aucun événement pour le moment.</p>;

  const now = new Date();

  return (
    <ul className="divide-y divide-bone/10 rounded-2xl border border-bone/10 bg-ink-2">
      {events.map((event) => {
        const registered = event._count.registrations;
        return (
          <li key={event.id}>
            <Link
              href={`/admin/evenements/${event.id}`}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-ink-3"
            >
              <span>
                <span className="block text-bone">
                  {event.title}
                  {!event.isPublished && (
                    <span className="ml-3 rounded-full border border-bone/20 px-2 py-0.5 text-xs text-bone-dim">
                      Brouillon
                    </span>
                  )}
                  {event.startsAt <= now && (
                    <span className="ml-3 rounded-full border border-bone/20 px-2 py-0.5 text-xs text-bone-dim">
                      Terminé
                    </span>
                  )}
                </span>
                <span className="block text-sm text-bone-dim">{formatDateTime(event.startsAt)}</span>
              </span>
              <span className="text-sm text-bone-dim">
                {event.capacity === null ? `${registered} inscrit(s)` : `${registered} / ${event.capacity} places`}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
