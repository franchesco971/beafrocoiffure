"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { FormState } from "@/lib/admin/forms";

export function CategoryForm({
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

  return (
    <form action={formAction} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Nom" name="name" errors={errors.name}>
          <Input
            id="name"
            name="name"
            defaultValue={values.name}
            required
            maxLength={80}
            className="h-11"
            aria-invalid={invalid("name")}
            aria-describedby={describedBy("name", false, invalid("name"))}
          />
        </Field>
        <Field label="Univers" name="universe" errors={errors.universe}>
          <NativeSelect key={values.universe} id="universe" name="universe" defaultValue={values.universe}>
            <option value="HAIR">Coiffure</option>
            <option value="WELLNESS">Beauté &amp; Bien-être</option>
          </NativeSelect>
        </Field>
        <Field
          label="Lien de la page"
          name="slug"
          hint="Laisser vide pour le générer à partir du nom."
          errors={errors.slug}
        >
          <Input
            id="slug"
            name="slug"
            defaultValue={values.slug}
            maxLength={80}
            className="h-11"
            aria-invalid={invalid("slug")}
            aria-describedby={describedBy("slug", true, invalid("slug"))}
          />
        </Field>
        <Field label="Ordre d'affichage" name="position" errors={errors.position}>
          <Input
            id="position"
            name="position"
            type="number"
            inputMode="numeric"
            min={0}
            max={9999}
            defaultValue={values.position}
            required
            className="h-11"
            aria-invalid={invalid("position")}
            aria-describedby={describedBy("position", false, invalid("position"))}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Link href="/admin/prestations" className="text-sm text-bone-dim transition-colors hover:text-bone">
          Annuler
        </Link>
      </div>
    </form>
  );
}
