"use client";

import { useActionState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/admin/forms";

export function ClientForm({
  action,
  defaults,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  defaults: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);
  const aria = (name: string) => ({
    "aria-invalid": invalid(name),
    "aria-describedby": describedBy(name, false, invalid(name)),
  });

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Prénom" name="firstName" errors={errors.firstName}>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={values.firstName}
            required
            maxLength={80}
            className="h-11"
            {...aria("firstName")}
          />
        </Field>
        <Field label="Nom" name="lastName" errors={errors.lastName}>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={values.lastName}
            required
            maxLength={80}
            className="h-11"
            {...aria("lastName")}
          />
        </Field>
        <Field label="Téléphone" name="phone" errors={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={values.phone}
            required
            maxLength={20}
            className="h-11"
            {...aria("phone")}
          />
        </Field>
        <Field label="E-mail" name="email" errors={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={values.email}
            maxLength={254}
            className="h-11"
            {...aria("email")}
          />
        </Field>
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 px-6">
        {pending ? "Enregistrement…" : "Enregistrer les coordonnées"}
      </Button>
    </form>
  );
}
