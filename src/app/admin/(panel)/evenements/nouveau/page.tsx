import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { requireRole } from "@/lib/auth/guard";
import { saveEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Nouvel événement" };

export default function NewEventPage() {
  return (
    <AdminPage title="Nouvel événement" back={{ href: "/admin/evenements", label: "Événements" }}>
      <Suspense fallback={<AdminLoading />}>
        <NewEventForm />
      </Suspense>
    </AdminPage>
  );
}

async function NewEventForm() {
  await requireRole("ADMIN");
  const defaults = {
    title: "",
    slug: "",
    description: "",
    date: "",
    time: "14:00",
    location: "",
    price: "",
    capacity: "",
    isPublished: "",
  };

  return <EventForm action={saveEvent.bind(null, null)} defaults={defaults} />;
}
