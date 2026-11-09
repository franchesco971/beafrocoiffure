import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { BookingStatusBadge } from "@/components/admin/BookingStatus";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { saveClient } from "../actions";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Fiche cliente" };

export default function ClientPage(props: PageProps<"/admin/clients/[id]">) {
  return (
    <AdminPage title="Fiche cliente" back={{ href: "/admin/clients", label: "Clients" }}>
      <Suspense fallback={<AdminLoading />}>
        <ClientDetail params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

async function ClientDetail({ params }: Pick<PageProps<"/admin/clients/[id]">, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const client = await db.client.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { startsAt: "desc" },
        include: { items: { orderBy: { id: "asc" }, include: { service: { select: { title: true } } } } },
      },
    },
  });
  if (!client) notFound();

  const now = new Date();
  const isUpcoming = (booking: (typeof client.bookings)[number]) =>
    booking.startsAt >= now && (booking.status === "PENDING" || booking.status === "CONFIRMED");
  // À venir : du plus proche au plus lointain ; historique : du plus récent au plus ancien.
  const upcoming = client.bookings.filter(isUpcoming).reverse();
  const history = client.bookings.filter((booking) => !isUpcoming(booking));

  const defaults = {
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    email: client.email ?? "",
  };

  return (
    <div className="space-y-14">
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-3xl text-bone">
            {client.firstName} {client.lastName}
          </h2>
          <Link
            href={`/admin/planning/rendez-vous/nouveau?client=${client.id}`}
            className={buttonVariants({ className: "h-11 px-5" })}
          >
            Nouveau rendez-vous
          </Link>
        </div>
        {client.anonymizedAt && (
          <p className="text-sm text-bone-dim">Cette fiche a été anonymisée : les coordonnées ne sont plus fiables.</p>
        )}
        <ClientForm action={saveClient.bind(null, id)} defaults={defaults} />
        <p className="text-sm text-bone-dim">
          Fiche créée le {formatDateTime(client.createdAt)}
          {client.consentAt
            ? ` · consentement recueilli le ${formatDateTime(client.consentAt)}`
            : " · consentement non recueilli en ligne"}
        </p>
      </section>

      <BookingList title="À venir" bookings={upcoming} empty="Aucun rendez-vous à venir." />
      <BookingList title="Historique" bookings={history} empty="Aucun rendez-vous passé." />
    </div>
  );
}

type ListedBooking = {
  id: number;
  status: Parameters<typeof BookingStatusBadge>[0]["status"];
  startsAt: Date;
  items: { id: number; service: { title: string } }[];
};

function BookingList({ title, bookings, empty }: { title: string; bookings: ListedBooking[]; empty: string }) {
  return (
    <section>
      <h2 className="display text-2xl text-bone">{title}</h2>
      {bookings.length === 0 ? (
        <p className="mt-4 text-bone-dim">{empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-bone/10 rounded-2xl border border-bone/10 bg-ink-2">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/admin/planning/rendez-vous/${booking.id}`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-ink-3"
              >
                <span>
                  <span className="block text-bone">{formatDateTime(booking.startsAt)}</span>
                  <span className="block text-sm text-bone-dim">
                    {booking.items.map((item) => item.service.title).join(" + ")}
                  </span>
                </span>
                <BookingStatusBadge status={booking.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
