"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { FormState } from "@/lib/admin/forms";

const DEFAULTS: Record<string, string> = {
  type: "HOLIDAY",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  reason: "",
};

export function TimeOffForm({ action }: { action: (previous: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? DEFAULTS;
  const errors = state.errors ?? {};
  const [allDay, setAllDay] = useState(true);
  const invalid = (name: string) => Boolean(errors[name]?.[0]);
  const aria = (name: string, hasHint = false) => ({
    "aria-invalid": invalid(name),
    "aria-describedby": describedBy(name, hasHint, invalid(name)),
  });

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-bone/10 bg-ink-2 p-5 md:p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Type" name="type" errors={errors.type}>
          <NativeSelect key={values.type} id="type" name="type" defaultValue={values.type}>
            <option value="HOLIDAY">Congés ou absence</option>
            <option value="BLOCK">Blocage ponctuel</option>
          </NativeSelect>
        </Field>
        <Field
          label="Motif"
          name="reason"
          hint="Facultatif, visible uniquement dans l'administration."
          errors={errors.reason}
        >
          <Input
            id="reason"
            name="reason"
            defaultValue={values.reason}
            maxLength={200}
            className="h-11"
            {...aria("reason", true)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="allDay"
          checked={allDay}
          onChange={(event) => setAllDay(event.target.checked)}
          className="size-5 accent-gold"
        />
        Journée entière
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Du" name="startDate" errors={errors.startDate}>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={values.startDate}
            required
            className="h-11"
            {...aria("startDate")}
          />
        </Field>
        <Field label="Heure de début" name="startTime" errors={errors.startTime}>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            step={300}
            defaultValue={values.startTime}
            disabled={allDay}
            required={!allDay}
            className="h-11"
            {...aria("startTime")}
          />
        </Field>
        <Field label="Au (inclus)" name="endDate" errors={errors.endDate}>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={values.endDate}
            required
            className="h-11"
            {...aria("endDate")}
          />
        </Field>
        <Field label="Heure de fin" name="endTime" errors={errors.endTime}>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            step={300}
            defaultValue={values.endTime}
            disabled={allDay}
            required={!allDay}
            className="h-11"
            {...aria("endTime")}
          />
        </Field>
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Enregistrement…" : "Ajouter"}
        </Button>
        <Link href="/admin/planning" className="text-sm text-bone-dim transition-colors hover:text-bone">
          Retour au planning
        </Link>
      </div>
    </form>
  );
}
