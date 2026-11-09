import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { saveWorkingHours } from "./actions";
import { HoursForm } from "./hours-form";

export const metadata: Metadata = { title: "Horaires de travail" };

export default function HoursPage() {
  return (
    <AdminPage title="Horaires de travail" back={{ href: "/admin/planning", label: "Planning" }}>
      <p className="mb-8 max-w-[62ch] text-bone-dim">
        Plages hebdomadaires pendant lesquelles les clientes peuvent réserver en ligne (heure de Paris). Les rendez-vous
        déjà pris ne sont pas modifiés. Les congés et blocages ponctuels se gèrent dans «&nbsp;Congés et
        blocages&nbsp;».
      </p>
      <Suspense fallback={<AdminLoading />}>
        <Hours />
      </Suspense>
    </AdminPage>
  );
}

async function Hours() {
  await requireRole("ADMIN");
  const hours = await db.workingHours.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
  const initial = hours.map((row) => ({
    weekday: row.weekday,
    start: row.startTime.toISOString().slice(11, 16),
    end: row.endTime.toISOString().slice(11, 16),
  }));

  return <HoursForm action={saveWorkingHours} initial={initial} />;
}
