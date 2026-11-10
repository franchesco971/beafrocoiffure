import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { BookingStatusBadge } from "@/components/admin/BookingStatus";
import { requireAdmin } from "@/lib/auth/guard";
import { addDays, dateKeyOf, formatDateTime, formatTime, minutesToMs, parisToUtc } from "@/lib/date";
import { db } from "@/lib/db";
import { ACTIVE_STATUSES } from "@/modules/booking/booking.service";

export default function AdminHome() {
  return (
    <AdminPage title="Tableau de bord">
      <Suspense fallback={<AdminLoading />}>
        <Dashboard />
      </Suspense>
    </AdminPage>
  );
}

const SECTIONS = [
  { href: "/admin/planning", title: "Planning", text: "Calendrier, rendez-vous, horaires, congés et blocages." },
  { href: "/admin/clients", title: "Clients", text: "Coordonnées et historique des rendez-vous." },
  { href: "/admin/prestations", title: "Prestations", text: "Catégories, tarifs, durées et visibilité." },
  { href: "/admin/galerie", title: "Galerie", text: "Photos, vidéos et avant/après." },
  { href: "/admin/evenements", title: "Événements", text: "Programme, places et inscrits." },
  { href: "/admin/avis", title: "Avis", text: "Modération des avis clients." },
  { href: "/admin/messages", title: "Messages", text: "Demandes reçues par le formulaire de contact." },
  { href: "/admin/contenus", title: "Contenus", text: "Coordonnées, réseaux sociaux et textes du site." },
  { href: "/admin/statistiques", title: "Statistiques", text: "Réservations, prestations et chiffre d’affaires." },
  { href: "/admin/parametres", title: "Paramètres", text: "Règles de réservation et compte administrateur." },
];

function Panel({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-bone/10 bg-ink-2 p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="display text-2xl text-bone">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-gold transition-colors hover:text-bone">
            Tout voir
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const EMPTY = "text-sm text-bone-dim";

async function Dashboard() {
  const admin = await requireAdmin();

  const now = new Date();
  const today = dateKeyOf(now);
  const dayStart = parisToUtc(today, 0);
  const dayEnd = parisToUtc(addDays(today, 1), 0);
  const withinWeek = new Date(now.getTime() + minutesToMs(7 * 24 * 60));

  const bookingInclude = {
    client: { select: { firstName: true, lastName: true } },
    items: { orderBy: { id: "asc" }, include: { service: { select: { title: true } } } },
  } as const;
  const upcoming = { startsAt: { gte: now } };

  const [
    todayBookings,
    toValidate,
    toValidateCount,
    changeRequests,
    weekCount,
    messages,
    messageCount,
    reviewCount,
    events,
  ] = await Promise.all([
    db.booking.findMany({
      where: { status: { in: ACTIVE_STATUSES }, startsAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startsAt: "asc" },
      include: bookingInclude,
    }),
    db.booking.findMany({
      where: { status: "PENDING", ...upcoming },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: bookingInclude,
    }),
    db.booking.count({ where: { status: "PENDING", ...upcoming } }),
    db.booking.count({ where: { status: { in: ACTIVE_STATUSES }, changeRequest: { not: null }, ...upcoming } }),
    db.booking.count({ where: { status: { in: ACTIVE_STATUSES }, startsAt: { gte: now, lt: withinWeek } } }),
    db.contactMessage.findMany({ where: { handled: false }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.contactMessage.count({ where: { handled: false } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.event.findMany({
      where: { isPublished: true, startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
      include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
    }),
  ]);

  const who = (booking: (typeof todayBookings)[number]) => `${booking.client.firstName} ${booking.client.lastName}`;
  const what = (booking: (typeof todayBookings)[number]) => booking.items.map((item) => item.service.title).join(" + ");

  return (
    <>
      <p className="text-bone-dim">Connecté en tant que {admin.email}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Rendez-vous sur 7 jours", value: weekCount, href: "/admin/planning" },
          { label: "Demandes à valider", value: toValidateCount, href: "/admin/planning" },
          { label: "Modifications demandées", value: changeRequests, href: "/admin/planning" },
          { label: "Avis à modérer", value: reviewCount, href: "/admin/avis" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="block rounded-2xl border border-bone/10 bg-ink-2 p-5 transition-colors hover:border-gold/50"
          >
            <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">{stat.label}</dt>
            <dd className={`display mt-2 text-5xl ${stat.value > 0 ? "text-gold" : "text-bone"}`}>{stat.value}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Panel title="Aujourd’hui" href="/admin/planning">
          {todayBookings.length === 0 ? (
            <p className={EMPTY}>Aucun rendez-vous aujourd’hui.</p>
          ) : (
            <ul className="divide-y divide-bone/10">
              {todayBookings.map((booking) => (
                <li key={booking.id}>
                  <Link
                    href={`/admin/planning/rendez-vous/${booking.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 transition-colors hover:text-gold"
                  >
                    <span>
                      <span className="block text-bone">
                        {formatTime(booking.startsAt)} · {who(booking)}
                      </span>
                      <span className="block text-sm text-bone-dim">{what(booking)}</span>
                    </span>
                    <BookingStatusBadge status={booking.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="À valider" href="/admin/planning">
          {toValidate.length === 0 ? (
            <p className={EMPTY}>Aucune demande en attente.</p>
          ) : (
            <ul className="divide-y divide-bone/10">
              {toValidate.map((booking) => (
                <li key={booking.id}>
                  <Link
                    href={`/admin/planning/rendez-vous/${booking.id}`}
                    className="block py-3 transition-colors hover:text-gold"
                  >
                    <span className="block text-bone">{who(booking)}</span>
                    <span className="block text-sm text-bone-dim">
                      {formatDateTime(booking.startsAt)} · {what(booking)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Messages à traiter" href="/admin/messages">
          {messages.length === 0 ? (
            <p className={EMPTY}>Aucun message en attente.</p>
          ) : (
            <>
              <ul className="divide-y divide-bone/10">
                {messages.map((message) => (
                  <li key={message.id} className="py-3">
                    <p className="text-bone">
                      {message.name}{" "}
                      <span className="text-sm text-bone-dim">· {formatDateTime(message.createdAt)}</span>
                    </p>
                    <p className="line-clamp-2 text-sm text-bone-dim">{message.message}</p>
                  </li>
                ))}
              </ul>
              {messageCount > messages.length && (
                <p className="mt-3 text-sm text-bone-dim">et {messageCount - messages.length} autre(s)</p>
              )}
            </>
          )}
        </Panel>

        <Panel title="Événements à venir" href="/admin/evenements">
          {events.length === 0 ? (
            <p className={EMPTY}>Aucun événement publié à venir.</p>
          ) : (
            <ul className="divide-y divide-bone/10">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/admin/evenements/${event.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 transition-colors hover:text-gold"
                  >
                    <span>
                      <span className="block text-bone">{event.title}</span>
                      <span className="block text-sm text-bone-dim">{formatDateTime(event.startsAt)}</span>
                    </span>
                    <span className="text-sm text-bone-dim">
                      {event.capacity === null
                        ? `${event._count.registrations} inscrit(s)`
                        : `${event._count.registrations} / ${event.capacity}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <h2 className="eyebrow mt-14">Sections</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block rounded-2xl border border-bone/10 bg-ink-2 p-6 transition-colors hover:border-gold/50"
          >
            <span className="display block text-2xl text-bone">{section.title}</span>
            <span className="mt-2 block text-sm text-bone-dim">{section.text}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
