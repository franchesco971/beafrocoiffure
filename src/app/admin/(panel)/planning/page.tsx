import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { PlanningCalendar, type BusinessHours } from "@/components/planning/PlanningCalendar";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guard";
import { isDateKey } from "@/lib/date";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Planning" };

const hhmm = (time: Date) => time.toISOString().slice(11, 16);
const minutesOf = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes();

export default function PlanningPage(props: PageProps<"/admin/planning">) {
  return (
    <AdminPage
      title="Planning"
      wide
      actions={
        <>
          <Link
            href="/admin/planning/horaires"
            className={buttonVariants({ variant: "outline", className: "h-11 px-5" })}
          >
            Horaires
          </Link>
          <Link
            href="/admin/planning/absences"
            className={buttonVariants({ variant: "outline", className: "h-11 px-5" })}
          >
            Congés et blocages
          </Link>
        </>
      }
    >
      <Suspense fallback={<AdminLoading />}>
        <Planning searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function Planning({ searchParams }: Pick<PageProps<"/admin/planning">, "searchParams">) {
  await requireAdmin();
  const { date } = await searchParams;
  const initialDate = typeof date === "string" && isDateKey(date) ? date : undefined;

  const hours = await db.workingHours.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
  // Weekday ISO 1 = lundi … 7 = dimanche ; FullCalendar : 0 = dimanche.
  const businessHours: BusinessHours[] = hours.map((row) => ({
    daysOfWeek: [row.weekday % 7],
    startTime: hhmm(row.startTime),
    endTime: hhmm(row.endTime),
  }));

  // Une heure de marge autour des horaires de travail, 7 h – 21 h sans horaire saisi.
  const startHour = hours.length
    ? Math.max(0, Math.floor(Math.min(...hours.map((row) => minutesOf(row.startTime))) / 60) - 1)
    : 7;
  const endHour = hours.length
    ? Math.min(24, Math.ceil(Math.max(...hours.map((row) => minutesOf(row.endTime))) / 60) + 1)
    : 21;
  const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00:00`;

  return (
    <PlanningCalendar
      initialDate={initialDate}
      businessHours={businessHours}
      slotMinTime={hourLabel(startHour)}
      slotMaxTime={hourLabel(endHour)}
    />
  );
}
