import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Button } from "@/components/ui/button";
import { centsToEuros, flagValue } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/guard";
import { dateKeyOf, formatDateTime, timeKeyOf } from "@/lib/date";
import { db } from "@/lib/db";
import { cancelRegistration, deleteEvent, saveEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Modifier l'événement" };

export default function EditEventPage(props: PageProps<"/admin/evenements/[id]">) {
  return (
    <AdminPage title="Modifier l'événement" back={{ href: "/admin/evenements", label: "Événements" }}>
      <Suspense fallback={<AdminLoading />}>
        <EditEvent params={props.params} />
      </Suspense>
    </AdminPage>
  );
}

async function EditEvent({ params }: Pick<PageProps<"/admin/evenements/[id]">, "params">) {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const event = await db.event.findUnique({
    where: { id },
    include: { registrations: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  if (!event) notFound();

  const confirmed = event.registrations.filter((registration) => registration.status === "CONFIRMED");
  const defaults = {
    title: event.title,
    slug: event.slug,
    description: event.description,
    date: dateKeyOf(event.startsAt),
    time: timeKeyOf(event.startsAt),
    location: event.location ?? "",
    price: centsToEuros(event.priceCents),
    capacity: event.capacity === null ? "" : String(event.capacity),
    isPublished: flagValue(event.isPublished),
  };

  return (
    <div className="space-y-14">
      {admin.role === "ADMIN" ? (
        <EventForm action={saveEvent.bind(null, id)} defaults={defaults} />
      ) : (
        <p className="text-bone-dim">Seul un administrateur peut modifier l’événement.</p>
      )}

      <section aria-labelledby="inscrits" className="border-t border-bone/10 pt-8">
        <h2 id="inscrits" className="display text-3xl text-bone">
          Inscrits{" "}
          <span className="text-lg text-bone-dim">
            ({event.capacity === null ? confirmed.length : `${confirmed.length} / ${event.capacity} places`})
          </span>
        </h2>

        {event.registrations.length === 0 ? (
          <p className="mt-4 text-bone-dim">Aucune inscription pour le moment.</p>
        ) : (
          <ul className="mt-5 divide-y divide-bone/10 rounded-2xl border border-bone/10 bg-ink-2">
            {event.registrations.map((registration) => (
              <li
                key={registration.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4"
              >
                <div>
                  <p className={registration.status === "CANCELLED" ? "text-bone-dim line-through" : "text-bone"}>
                    {registration.name}
                  </p>
                  <p className="text-sm text-bone-dim">
                    <a href={`mailto:${registration.email}`} className="transition-colors hover:text-gold">
                      {registration.email}
                    </a>
                    {registration.phone && ` · ${registration.phone}`} · inscrit le{" "}
                    {formatDateTime(registration.createdAt)}
                  </p>
                </div>
                {registration.status === "CONFIRMED" ? (
                  <form action={cancelRegistration.bind(null, id, registration.id)}>
                    <Button type="submit" variant="outline" className="h-11 px-5">
                      Annuler l’inscription
                    </Button>
                  </form>
                ) : (
                  <span className="rounded-full border border-bone/20 px-2 py-0.5 text-xs text-bone-dim">Annulée</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {admin.role === "ADMIN" && (
        <section className="border-t border-bone/10 pt-8">
          <h2 className="eyebrow">Zone sensible</h2>
          <p className="mt-3 max-w-[60ch] text-sm text-bone-dim">
            La suppression efface aussi la liste des inscrits. Pour simplement retirer l’événement du site, décochez «
            publié ».
          </p>
          <div className="mt-5">
            <DeleteForm
              action={deleteEvent.bind(null, id)}
              label="Supprimer l'événement"
              confirmMessage={`Supprimer définitivement « ${event.title} » et ses inscriptions ?`}
            />
          </div>
        </section>
      )}
    </div>
  );
}
