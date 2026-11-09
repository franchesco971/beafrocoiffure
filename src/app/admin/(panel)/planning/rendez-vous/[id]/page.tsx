import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { BookingStatusBadge, BOOKING_STATUS_LABELS } from "@/components/admin/BookingStatus";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { BookingForm } from "@/components/planning/BookingForm";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guard";
import { dateKeyOf, formatDateTime, timeKeyOf } from "@/lib/date";
import { db } from "@/lib/db";
import { formatDuration, formatPrice } from "@/lib/format";
import { cancelBookingAction, dismissChangeRequestAction, saveBookingAction } from "../../actions";

export const metadata: Metadata = { title: "Rendez-vous" };

const SOURCE_LABELS = { ONLINE: "Réservation en ligne", ADMIN: "Saisi dans l'administration" } as const;

const STATUSES = (Object.keys(BOOKING_STATUS_LABELS) as (keyof typeof BOOKING_STATUS_LABELS)[]).map((value) => ({
  value,
  label: BOOKING_STATUS_LABELS[value],
}));

export default function BookingPage(props: PageProps<"/admin/planning/rendez-vous/[id]">) {
  return (
    <AdminPage title="Rendez-vous" back={{ href: "/admin/planning", label: "Planning" }}>
      <Suspense fallback={<AdminLoading />}>
        <BookingDetail params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

async function BookingDetail({ params }: Pick<PageProps<"/admin/planning/rendez-vous/[id]">, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      client: true,
      items: { orderBy: { id: "asc" }, include: { service: { select: { title: true } } } },
    },
  });
  if (!booking) notFound();

  const { client } = booking;
  const serviceMinutes = booking.items.reduce((total, item) => total + item.durationMin, 0);
  const blockMinutes = Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000);
  const defaults = {
    date: dateKeyOf(booking.startsAt),
    time: timeKeyOf(booking.startsAt),
    status: booking.status,
    locationType: booking.locationType ?? "",
    address: booking.address ?? "",
    notes: booking.notes ?? "",
  };

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="display text-2xl text-bone">{formatDateTime(booking.startsAt)}</p>
          <BookingStatusBadge status={booking.status} />
        </div>

        <dl className="grid gap-x-10 gap-y-4 text-sm md:grid-cols-2">
          <div>
            <dt className="eyebrow">Cliente</dt>
            <dd className="mt-1 text-bone">
              <Link href={`/admin/clients/${client.id}`} className="transition-colors hover:text-gold">
                {client.firstName} {client.lastName}
              </Link>
              <span className="block text-bone-dim">
                <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="hover:text-bone">
                  {client.phone}
                </a>
                {client.email && (
                  <>
                    {" · "}
                    <a href={`mailto:${client.email}`} className="hover:text-bone">
                      {client.email}
                    </a>
                  </>
                )}
              </span>
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Origine</dt>
            <dd className="mt-1 text-bone-dim">{SOURCE_LABELS[booking.source]}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="eyebrow">Prestations</dt>
            <dd className="mt-1">
              <ul className="divide-y divide-bone/10 rounded-lg border border-bone/10">
                {booking.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-bone">
                    <span>{item.service.title}</span>
                    <span className="text-bone-dim">
                      {formatDuration(item.durationMin)} ·{" "}
                      {item.priceCents === null ? "Sur devis" : formatPrice(item.priceCents)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-bone-dim">
                Durée {formatDuration(serviceMinutes)}
                {blockMinutes > serviceMinutes &&
                  `, pause de ${formatDuration(blockMinutes - serviceMinutes)} comprise dans le créneau`}
                .
              </p>
            </dd>
          </div>
        </dl>

        {booking.changeRequest && (
          <div className="rounded-lg border border-ember/50 bg-ember/10 p-4">
            <p className="eyebrow text-ember">Demande de modification de la cliente</p>
            <p className="mt-2 whitespace-pre-line text-bone">{booking.changeRequest}</p>
            <form action={dismissChangeRequestAction.bind(null, id)} className="mt-4">
              <Button type="submit" variant="outline" className="h-11 px-5">
                Marquer comme traitée
              </Button>
            </form>
            <p className="mt-2 text-xs text-bone-dim">Déplacer le rendez-vous la marque aussi comme traitée.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="display text-2xl text-bone">Modifier</h2>
        <div className="mt-6">
          <BookingForm
            action={saveBookingAction.bind(null, id)}
            defaults={defaults}
            statuses={STATUSES}
            cancelHref="/admin/planning"
            cancelLabel="Retour au planning"
            submitLabel="Enregistrer"
          />
        </div>
      </section>

      {booking.status !== "CANCELLED" && (
        <section className="border-t border-bone/10 pt-8">
          <h2 className="eyebrow">Zone sensible</h2>
          <p className="mt-3 max-w-[60ch] text-sm text-bone-dim">
            Annuler libère immédiatement le créneau. L&apos;historique de la cliente est conservé.
          </p>
          <div className="mt-5">
            <DeleteForm
              action={cancelBookingAction.bind(null, id)}
              label="Annuler le rendez-vous"
              pendingLabel="Annulation…"
              confirmMessage={`Annuler le rendez-vous de ${client.firstName} ${client.lastName} ?`}
            />
          </div>
        </section>
      )}
    </div>
  );
}
