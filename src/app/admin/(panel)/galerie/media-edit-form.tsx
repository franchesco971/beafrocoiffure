"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { FormState } from "@/lib/admin/forms";

export function MediaEditForm({
  action,
  categories,
  defaults,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  categories: { id: number; name: string }[];
  defaults: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const firstError = Object.values(errors).find((messages) => messages?.[0])?.[0];

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem_6rem]">
        <Input
          name="alt"
          defaultValue={values.alt}
          maxLength={200}
          placeholder="Description de l’image"
          aria-label="Description de l’image"
          className="h-11"
        />
        <NativeSelect key={values.categoryId} name="categoryId" defaultValue={values.categoryId} aria-label="Catégorie">
          <option value="">Sans catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
        <Input
          name="position"
          type="number"
          inputMode="numeric"
          min={0}
          max={9999}
          defaultValue={values.position}
          aria-label="Ordre d’affichage"
          className="h-11"
        />
      </div>
      {firstError && (
        <p role="alert" className="text-sm text-destructive">
          {firstError}
        </p>
      )}
      <Button type="submit" variant="outline" disabled={pending} className="h-11 px-5">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
