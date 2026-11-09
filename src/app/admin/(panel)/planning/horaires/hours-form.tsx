"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/admin/forms";

export type HoursRow = { weekday: number; start: string; end: string };

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const NEW_RANGE = { start: "09:00", end: "18:00" };

export function HoursForm({
  action,
  initial,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  initial: HoursRow[];
}) {
  const [rows, setRows] = useState(initial);
  const [state, formAction, pending] = useActionState(action, {});

  const update = (index: number, patch: Partial<HoursRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="hours" value={JSON.stringify(rows)} />

      <ul className="divide-y divide-bone/10 rounded-2xl border border-bone/10 bg-ink-2">
        {DAYS.map((day, dayIndex) => {
          const weekday = dayIndex + 1;
          const ranges = rows.flatMap((row, index) => (row.weekday === weekday ? [{ row, index }] : []));

          return (
            <li key={day} className="flex flex-wrap items-start gap-x-8 gap-y-3 px-5 py-4">
              <p className="w-28 pt-2.5 text-bone">{day}</p>
              <div className="min-w-0 grow space-y-3">
                {ranges.length === 0 && <p className="pt-2.5 text-sm text-bone-dim">Fermé</p>}
                {ranges.map(({ row, index }, position) => (
                  <div key={index} className="flex flex-wrap items-center gap-3">
                    <Input
                      type="time"
                      step={300}
                      value={row.start}
                      onChange={(event) => update(index, { start: event.target.value })}
                      required
                      aria-label={`${day}, début de la plage ${position + 1}`}
                      className="h-11 w-32"
                    />
                    <span aria-hidden className="text-bone-dim">
                      à
                    </span>
                    <Input
                      type="time"
                      step={300}
                      value={row.end}
                      onChange={(event) => update(index, { end: event.target.value })}
                      required
                      aria-label={`${day}, fin de la plage ${position + 1}`}
                      className="h-11 w-32"
                    />
                    <button
                      type="button"
                      onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                      className="text-sm text-bone-dim transition-colors hover:text-destructive"
                    >
                      Retirer
                      <span className="sr-only">
                        {" "}
                        la plage {position + 1} du {day.toLowerCase()}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRows((current) => [...current, { weekday, ...NEW_RANGE }])}
                className="pt-2.5 text-sm text-gold transition-colors hover:text-bone"
              >
                Ajouter une plage<span className="sr-only"> le {day.toLowerCase()}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Enregistrement…" : "Enregistrer les horaires"}
        </Button>
        <Link href="/admin/planning" className="text-sm text-bone-dim transition-colors hover:text-bone">
          Annuler
        </Link>
      </div>
    </form>
  );
}
