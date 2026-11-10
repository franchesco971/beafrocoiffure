"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/admin/forms";

// Création (liste de valeurs vides) ou modification d'une catégorie de galerie.
export function GalleryCategoryForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  defaults: Record<string, string>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const firstError = Object.values(state.errors ?? {}).find((messages) => messages?.[0])?.[0];

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          name="name"
          defaultValue={values.name}
          required
          maxLength={80}
          placeholder="Nom de la catégorie"
          aria-label="Nom de la catégorie"
          className="h-11 w-64"
        />
        <Input
          name="position"
          type="number"
          inputMode="numeric"
          min={0}
          max={9999}
          defaultValue={values.position}
          aria-label="Ordre d’affichage"
          className="h-11 w-24"
        />
        <Button type="submit" variant="outline" disabled={pending} className="h-11 px-5">
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
      {firstError && (
        <p role="alert" className="text-sm text-destructive">
          {firstError}
        </p>
      )}
    </form>
  );
}
