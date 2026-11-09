import { ChevronLeft, ChevronRight } from "lucide-react";
import { Arrow } from "@/components/ui/Arrow";
import { formatDay, formatTime, isoWeekday, shiftMonth } from "@/lib/date";
import { PRIMARY_BUTTON } from "./styles";

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
// Au-delà, l'horizon de réservation est de toute façon dépassé.
const MAX_MONTHS_AHEAD = 6;

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const navButton =
  "grid size-11 place-items-center rounded-full border border-bone/20 text-bone transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30";

export function SlotStep({
  month,
  currentMonth,
  days,
  error,
  notice,
  day,
  slot,
  onMonth,
  onDay,
  onSlot,
  onNext,
}: {
  month: string;
  currentMonth: string;
  /** Créneaux par jour du mois affiché ; `null` pendant le chargement. */
  days: Record<string, string[]> | null;
  error: string | null;
  notice: string | null;
  day: string | null;
  slot: string | null;
  onMonth: (month: string) => void;
  onDay: (day: string) => void;
  onSlot: (slot: string) => void;
  onNext: () => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1));
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const blanks = isoWeekday(`${month}-01`) - 1;
  const slots = day && days ? (days[day] ?? []) : [];
  const empty = days !== null && Object.keys(days).length === 0;

  return (
    <div>
      {notice && (
        <p role="alert" className="mb-8 border-l-2 border-ember pl-5 text-bone">
          {notice}
        </p>
      )}

      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] md:gap-12">
        <div className="max-w-md">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className={navButton}
              onClick={() => onMonth(shiftMonth(month, -1))}
              disabled={month <= currentMonth}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h3 className="display text-center text-2xl capitalize text-bone md:text-3xl" aria-live="polite">
              {monthFormat.format(monthStart)}
            </h3>
            <button
              type="button"
              className={navButton}
              onClick={() => onMonth(shiftMonth(month, 1))}
              disabled={month >= shiftMonth(currentMonth, MAX_MONTHS_AHEAD)}
              aria-label="Mois suivant"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div
            className={`mt-6 grid grid-cols-7 gap-1.5 transition-opacity ${days === null ? "opacity-40" : ""}`}
            aria-busy={days === null}
          >
            {WEEKDAYS.map((name) => (
              <span
                key={name}
                className="pb-2 text-center text-[0.7rem] uppercase tracking-[0.18em] text-bone-dim"
                aria-hidden="true"
              >
                {name[0]}
              </span>
            ))}
            {Array.from({ length: blanks }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: dayCount }, (_, index) => {
              const key = `${month}-${String(index + 1).padStart(2, "0")}`;
              const available = (days?.[key]?.length ?? 0) > 0;
              const selected = key === day;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!available}
                  aria-pressed={selected}
                  aria-label={`${dayLabel.format(new Date(`${key}T00:00:00Z`))}${available ? "" : " : indisponible"}`}
                  onClick={() => onDay(key)}
                  className={`aspect-square rounded-full text-sm transition-colors ${
                    selected
                      ? "bg-gold font-medium text-ink"
                      : available
                        ? "border border-gold/40 text-bone hover:bg-gold/15"
                        : "text-bone-dim/40"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mt-6 text-sm text-destructive">
              {error}
            </p>
          )}
          {empty && !error && (
            <p className="mt-6 text-sm text-bone-dim" role="status">
              Aucun créneau libre ce mois-ci pour cette durée. Essayez le mois suivant ou contactez-nous.
            </p>
          )}
        </div>

        <div>
          <h3 className="eyebrow">{day ? formatDay(new Date(`${day}T12:00:00Z`)) : "Horaires"}</h3>
          {day ? (
            <ul className="mt-5 grid grid-cols-3 gap-2 md:grid-cols-2">
              {slots.map((iso) => (
                <li key={iso}>
                  <button
                    type="button"
                    aria-pressed={iso === slot}
                    onClick={() => onSlot(iso)}
                    className={`w-full rounded-full border px-3 py-2.5 text-sm transition-colors ${
                      iso === slot
                        ? "border-gold bg-gold font-medium text-ink"
                        : "border-bone/20 text-bone hover:border-gold hover:text-gold"
                    }`}
                  >
                    {formatTime(iso)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-bone-dim">Choisissez un jour pour voir les horaires libres.</p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <button type="button" onClick={onNext} disabled={!slot} className={PRIMARY_BUTTON}>
          Mes coordonnées
          <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
        </button>
      </div>
    </div>
  );
}
