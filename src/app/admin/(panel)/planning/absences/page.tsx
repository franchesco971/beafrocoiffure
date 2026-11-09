import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { requireAdmin } from "@/lib/auth/guard";
import { dateKeyOf, formatDateTime, formatDay, formatTime, timeKeyOf } from "@/lib/date";
import { db } from "@/lib/db";
import { createTimeOff, deleteTimeOff } from "./actions";
import { TimeOffForm } from "./time-off-form";

export const metadata: Metadata = { title: "Congés et blocages" };

const TYPE_LABELS = { HOLIDAY: "Congés ou absence", BLOCK: "Blocage ponctuel" } as const;

export default function TimeOffPage() {
  return (
    <AdminPage title="Congés et blocages" back={{ href: "/admin/planning", label: "Planning" }}>
      <p className="mb-8 max-w-[62ch] text-bone-dim">
        Ces périodes retirent les créneaux de la réservation en ligne. Les rendez-vous déjà pris ne sont pas annulés :
        ils sont signalés pour que vous puissiez les déplacer.
      </p>
      <Suspense fallback={<AdminLoading />}>
        <TimeOffContent />
      </Suspense>
    </AdminPage>
  );
}

type Period = { startsAt: Date; endsAt: Date };

function describePeriod({ startsAt, endsAt }: Period) {
  const lastInstant = new Date(endsAt.getTime() - 1);
  const sameDay = dateKeyOf(startsAt) === dateKeyOf(lastInstant);
  if (timeKeyOf(startsAt) === "00:00" && timeKeyOf(endsAt) === "00:00") {
    return sameDay ? formatDay(startsAt) : `Du ${formatDay(startsAt)} au ${formatDay(lastInstant)}`;
  }
  return sameDay
    ? `${formatDay(startsAt)}, de ${formatTime(startsAt)} à ${formatTime(endsAt)}`
    : `Du ${formatDateTime(startsAt)} au ${formatDateTime(endsAt)}`;
}

async function TimeOffContent() {
  await requireAdmin();

  const now = new Date();
  const [upcoming, past, total] = await Promise.all([
    db.timeOff.findMany({ where: { endsAt: { gt: now } }, orderBy: { startsAt: "asc" } }),
    db.timeOff.findMany({ where: { endsAt: { lte: now } }, orderBy: { startsAt: "desc" }, take: 10 }),
    db.timeOff.count(),
  ]);

  const affected =
    upcoming.length === 0
      ? []
      : await db.booking.findMany({
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            OR: upcoming.map((off) => ({ startsAt: { lt: off.endsAt }, endsAt: { gt: off.startsAt } })),
          },
          select: { startsAt: true, endsAt: true },
        });

  return (
    <div className="space-y-12">
      <section>
        <h2 className="display text-2xl text-bone">Ajouter une période</h2>
        <div className="mt-6">
          <TimeOffForm key={total} action={createTimeOff} />
        </div>
      </section>

      <section>
        <h2 className="display text-2xl text-bone">À venir</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-bone-dim">Aucun congé ni blocage à venir.</p>
        ) : (
          <ul className="mt-6 divide-y divide-bone/10 rounded-2xl border border-bone/10 bg-ink-2">
            {upcoming.map((off) => {
              const conflicts = affected.filter(
                (booking) => booking.startsAt < off.endsAt && booking.endsAt > off.startsAt,
              ).length;
              return (
                <li key={off.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
                  <div>
                    <p className="text-bone">
                      {TYPE_LABELS[off.type]}
                      {off.reason && <span className="text-bone-dim"> — {off.reason}</span>}
                    </p>
                    <p className="mt-1 text-sm text-bone-dim">{describePeriod(off)}</p>
                    {conflicts > 0 && (
                      <p role="status" className="mt-1 text-sm text-ember">
                        {conflicts} rendez-vous à déplacer ou à annuler sur cette période.
                      </p>
                    )}
                  </div>
                  <DeleteForm
                    action={deleteTimeOff.bind(null, off.id)}
                    label="Supprimer"
                    confirmMessage="Supprimer cette période ? Les créneaux redeviendront réservables."
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="display text-2xl text-bone">Passés</h2>
          <ul className="mt-6 divide-y divide-bone/10 rounded-2xl border border-bone/10">
            {past.map((off) => (
              <li key={off.id} className="px-5 py-3 text-sm text-bone-dim">
                {TYPE_LABELS[off.type]}
                {off.reason && ` — ${off.reason}`} · {describePeriod(off)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
