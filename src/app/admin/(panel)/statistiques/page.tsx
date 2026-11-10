import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/guard";
import { dateKeyOf } from "@/lib/date";
import { formatPrice } from "@/lib/format";
import { computeStats, periodPresets, resolvePeriod, type Stats } from "@/modules/stats/stats";
import { loadPeriodBookings } from "@/modules/stats/stats.service";

export const metadata: Metadata = { title: "Statistiques" };

export default function StatsPage(props: PageProps<"/admin/statistiques">) {
  return (
    <AdminPage title="Statistiques">
      <Suspense fallback={<AdminLoading />}>
        <Statistics searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}

const first = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

const dayLabel = (key: string) => `${key.slice(8)}/${key.slice(5, 7)}`;
const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
const periodLabel = (key: string, bucket: Stats["bucket"]) =>
  bucket === "day" ? dayLabel(key) : monthFormat.format(new Date(`${key}-01T00:00:00Z`));

function Chart({ series, bucket }: { series: Stats["series"]; bucket: Stats["bucket"] }) {
  const max = Math.max(1, ...series.map((point) => point.count));
  // Une étiquette sur sept en vue quotidienne, pour rester lisible.
  const step = bucket === "day" ? 7 : 1;

  return (
    <ul className="flex h-44 items-end gap-px" aria-label="Réservations par période">
      {series.map((point, index) => (
        <li key={point.key} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
          <span className="sr-only">
            {periodLabel(point.key, bucket)} : {point.count} réservation(s)
          </span>
          <span
            aria-hidden="true"
            title={`${periodLabel(point.key, bucket)} : ${point.count}`}
            className="block w-full rounded-t bg-gold/80"
            style={{ height: `${(point.count / max) * 100}%`, minHeight: point.count > 0 ? "2px" : 0 }}
          />
          <span
            aria-hidden="true"
            className="mt-2 block h-4 overflow-visible whitespace-nowrap text-[10px] text-bone-dim"
          >
            {index % step === 0 ? periodLabel(point.key, bucket) : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

async function Statistics({ searchParams }: Pick<PageProps<"/admin/statistiques">, "searchParams">) {
  await requireRole("ADMIN");
  const query = await searchParams;
  const today = dateKeyOf(new Date());
  const period = resolvePeriod(first(query.from), first(query.to), today);
  const stats = computeStats(await loadPeriodBookings(period), period);

  const tiles = [
    { label: "Réservations", value: String(stats.total) },
    { label: "Annulées", value: String(stats.cancelled) },
    { label: "Absences", value: String(stats.noShow) },
    { label: "Chiffre d’affaires réalisé", value: formatPrice(stats.realizedCents) },
    { label: "Chiffre d’affaires prévu", value: formatPrice(stats.expectedCents) },
  ];

  return (
    <div className="space-y-12">
      <section aria-label="Période" className="space-y-5">
        <form className="flex flex-wrap items-end gap-3">
          <label className="space-y-2 text-sm">
            <span className="block">Du</span>
            <Input type="date" name="from" defaultValue={period.from} required className="h-11" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block">Au</span>
            <Input type="date" name="to" defaultValue={period.to} required className="h-11" />
          </label>
          <Button type="submit" className="h-11 px-5">
            Afficher
          </Button>
          <a
            href={`/api/admin/stats/export?from=${period.from}&to=${period.to}`}
            className={buttonVariants({ variant: "outline", className: "h-11 px-5" })}
          >
            Exporter en CSV
          </a>
        </form>
        <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {periodPresets(today).map((preset) => (
            <Link
              key={preset.label}
              href={`/admin/statistiques?from=${preset.from}&to=${preset.to}`}
              className="text-bone-dim transition-colors hover:text-gold"
            >
              {preset.label}
            </Link>
          ))}
        </p>
      </section>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-bone/10 bg-ink-2 p-5">
            <dt className="text-xs uppercase tracking-[0.18em] text-bone-dim">{tile.label}</dt>
            <dd className="display mt-2 text-3xl text-bone">{tile.value}</dd>
          </div>
        ))}
      </dl>
      {stats.quoteItems > 0 && (
        <p className="-mt-6 text-sm text-bone-dim">
          {stats.quoteItems} prestation(s) sur devis : elles ne sont pas comprises dans les montants.
        </p>
      )}

      <section aria-labelledby="serie">
        <h2 id="serie" className="display text-3xl text-bone">
          Réservations par {stats.bucket === "day" ? "jour" : "mois"}
        </h2>
        <div className="mt-6 rounded-2xl border border-bone/10 bg-ink-2 p-5">
          <Chart series={stats.series} bucket={stats.bucket} />
        </div>
      </section>

      <section aria-labelledby="prestations">
        <h2 id="prestations" className="display text-3xl text-bone">
          Prestations les plus demandées
        </h2>
        {stats.topServices.length === 0 ? (
          <p className="mt-4 text-bone-dim">Aucune réservation sur cette période.</p>
        ) : (
          <table className="mt-6 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-bone-dim">
              <tr>
                <th scope="col" className="pb-3 font-normal">
                  Prestation
                </th>
                <th scope="col" className="pb-3 text-right font-normal">
                  Réservations
                </th>
                <th scope="col" className="pb-3 text-right font-normal">
                  CA réalisé
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone/10 border-t border-bone/10">
              {stats.topServices.slice(0, 10).map((service) => (
                <tr key={service.serviceId}>
                  <th scope="row" className="py-3 font-normal text-bone">
                    {service.title}
                  </th>
                  <td className="py-3 text-right text-bone">{service.count}</td>
                  <td className="py-3 text-right text-bone-dim">{formatPrice(service.realizedCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
