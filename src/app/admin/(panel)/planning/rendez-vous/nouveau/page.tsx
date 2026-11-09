import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { BookingForm } from "@/components/planning/BookingForm";
import { requireAdmin } from "@/lib/auth/guard";
import { dateKeyOf, isDateKey } from "@/lib/date";
import { db } from "@/lib/db";
import { createBookingAction } from "../../actions";

export const metadata: Metadata = { title: "Nouveau rendez-vous" };

const STATUSES = [
  { value: "CONFIRMED", label: "Confirmé" },
  { value: "PENDING", label: "À valider" },
  { value: "COMPLETED", label: "Terminé" },
];

export default function NewBookingPage(props: PageProps<"/admin/planning/rendez-vous/nouveau">) {
  return (
    <AdminPage title="Nouveau rendez-vous" back={{ href: "/admin/planning", label: "Planning" }}>
      <Suspense fallback={<AdminLoading />}>
        <NewBooking searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function NewBooking({ searchParams }: Pick<PageProps<"/admin/planning/rendez-vous/nouveau">, "searchParams">) {
  await requireAdmin();
  const params = await searchParams;
  const param = (name: string) => (typeof params[name] === "string" ? params[name] : "");

  const clientId = /^\d+$/.test(param("client")) ? Number(param("client")) : null;
  const [categories, client] = await Promise.all([
    db.serviceCategory.findMany({
      orderBy: [{ universe: "asc" }, { position: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        services: {
          where: { isActive: true },
          orderBy: [{ position: "asc" }, { id: "asc" }],
          select: { id: true, title: true, durationMin: true },
        },
      },
    }),
    clientId === null
      ? null
      : db.client.findUnique({
          where: { id: clientId },
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        }),
  ]);

  const date = param("date");
  const time = param("time");
  const defaults = {
    date: isDateKey(date) ? date : dateKeyOf(new Date()),
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "",
    status: "CONFIRMED",
    locationType: "",
    address: "",
    notes: "",
    serviceIds: /^\d+$/.test(param("service")) ? param("service") : "",
    clientId: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  };

  return (
    <BookingForm
      action={createBookingAction}
      defaults={defaults}
      statuses={STATUSES}
      create={{
        groups: categories.filter((category) => category.services.length > 0),
        client: client && {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          phone: client.phone,
          email: client.email,
        },
      }}
      cancelHref="/admin/planning"
      submitLabel="Créer le rendez-vous"
    />
  );
}
