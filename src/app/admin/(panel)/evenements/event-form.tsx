"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/admin/forms";

export function EventForm({
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
      <Field label="Titre" name="title" errors={errors.title}>
        <Input
          id="title"
          name="title"
          defaultValue={values.title}
          required
          maxLength={120}
          className="h-11"
          aria-invalid={invalid("title")}
          aria-describedby={describedBy("title", false, invalid("title"))}
        />
      </Field>

      <Field label="Description" name="description" errors={errors.description}>
        <Textarea
          id="description"
          name="description"
          defaultValue={values.description}
          maxLength={4000}
          rows={5}
          aria-invalid={invalid("description")}
          aria-describedby={describedBy("description", false, invalid("description"))}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Date" name="date" errors={errors.date}>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={values.date}
            required
            className="h-11"
            aria-invalid={invalid("date")}
            aria-describedby={describedBy("date", false, invalid("date"))}
          />
        </Field>
        <Field label="Heure de début" name="time" hint="Heure de Paris." errors={errors.time}>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={values.time}
            required
            className="h-11"
            aria-invalid={invalid("time")}
            aria-describedby={describedBy("time", true, invalid("time"))}
          />
        </Field>
      </div>

      <Field label="Lieu" name="location" errors={errors.location}>
        <Input
          id="location"
          name="location"
          defaultValue={values.location}
          maxLength={200}
          className="h-11"
          aria-invalid={invalid("location")}
          aria-describedby={describedBy("location", false, invalid("location"))}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Tarif (€)" name="price" hint="Laisser vide pour un événement gratuit." errors={errors.price}>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={values.price}
            className="h-11"
            aria-invalid={invalid("price")}
            aria-describedby={describedBy("price", true, invalid("price"))}
          />
        </Field>
        <Field
          label="Nombre de places"
          name="capacity"
          hint="Laisser vide pour des places illimitées."
          errors={errors.capacity}
        >
          <Input
            id="capacity"
            name="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={99999}
            defaultValue={values.capacity}
            className="h-11"
            aria-invalid={invalid("capacity")}
            aria-describedby={describedBy("capacity", true, invalid("capacity"))}
          />
        </Field>
      </div>

      <Field
        label="Lien de la page"
        name="slug"
        hint="Laisser vide pour le générer à partir du titre."
        errors={errors.slug}
      >
        <Input
          id="slug"
          name="slug"
          defaultValue={values.slug}
          maxLength={120}
          className="h-11"
          aria-invalid={invalid("slug")}
          aria-describedby={describedBy("slug", true, invalid("slug"))}
        />
      </Field>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={values.isPublished === "on"}
          className="size-5 accent-gold"
        />
        Événement publié (visible et ouvert aux inscriptions)
      </label>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Link href="/admin/evenements" className="text-sm text-bone-dim transition-colors hover:text-bone">
          Annuler
        </Link>
      </div>
    </form>
  );
}
