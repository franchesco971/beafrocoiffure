"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/admin/forms";

type CategoryOption = { id: number; name: string; universe: "HAIR" | "WELLNESS" };

const UNIVERSE_LABELS = { HAIR: "Coiffure", WELLNESS: "Beauté & Bien-être" } as const;

export function ServiceForm({
  action,
  categories,
  defaults,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  categories: CategoryOption[];
  defaults: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);

  return (
    <form action={formAction} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
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
        <Field label="Catégorie" name="categoryId" errors={errors.categoryId}>
          <NativeSelect
            key={values.categoryId}
            id="categoryId"
            name="categoryId"
            defaultValue={values.categoryId}
            required
            aria-invalid={invalid("categoryId")}
            aria-describedby={describedBy("categoryId", false, invalid("categoryId"))}
          >
            <option value="">Choisir…</option>
            {(["HAIR", "WELLNESS"] as const).map((universe) => (
              <optgroup key={universe} label={UNIVERSE_LABELS[universe]}>
                {categories
                  .filter((category) => category.universe === universe)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field
        label="Description"
        name="description"
        hint="Présentation courte, affichée dans la liste et sur la fiche."
        errors={errors.description}
      >
        <Textarea
          id="description"
          name="description"
          defaultValue={values.description}
          maxLength={2000}
          rows={3}
          aria-invalid={invalid("description")}
          aria-describedby={describedBy("description", true, invalid("description"))}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Durée (minutes)" name="durationMin" errors={errors.durationMin}>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            inputMode="numeric"
            min={5}
            max={1440}
            step={5}
            defaultValue={values.durationMin}
            required
            className="h-11"
            aria-invalid={invalid("durationMin")}
            aria-describedby={describedBy("durationMin", false, invalid("durationMin"))}
          />
        </Field>
        <Field label="Tarif" name="priceMode" errors={errors.priceMode}>
          <NativeSelect key={values.priceMode} id="priceMode" name="priceMode" defaultValue={values.priceMode}>
            <option value="QUOTE">Sur devis</option>
            <option value="FIXED">Tarif fixe</option>
          </NativeSelect>
        </Field>
        <Field label="Prix (€)" name="price" hint="Pris en compte avec un tarif fixe." errors={errors.price}>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={values.price}
            placeholder="45 ou 45,50"
            className="h-11"
            aria-invalid={invalid("price")}
            aria-describedby={describedBy("price", true, invalid("price"))}
          />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Acompte (€)" name="deposit" hint="Facultatif." errors={errors.deposit}>
          <Input
            id="deposit"
            name="deposit"
            inputMode="decimal"
            defaultValue={values.deposit}
            className="h-11"
            aria-invalid={invalid("deposit")}
            aria-describedby={describedBy("deposit", true, invalid("deposit"))}
          />
        </Field>
        <Field
          label="Vidéo"
          name="videoUrl"
          hint="Lien YouTube, Vimeo ou fichier .mp4 / .webm en https."
          errors={errors.videoUrl}
        >
          <Input
            id="videoUrl"
            name="videoUrl"
            type="url"
            defaultValue={values.videoUrl}
            maxLength={500}
            className="h-11"
            aria-invalid={invalid("videoUrl")}
            aria-describedby={describedBy("videoUrl", true, invalid("videoUrl"))}
          />
        </Field>
      </div>

      <Field
        label="Conditions et recommandations"
        name="conditions"
        hint="Affichées avant la réservation : préparation, durée de pose, contre-indications…"
        errors={errors.conditions}
      >
        <Textarea
          id="conditions"
          name="conditions"
          defaultValue={values.conditions}
          maxLength={4000}
          rows={4}
          aria-invalid={invalid("conditions")}
          aria-describedby={describedBy("conditions", true, invalid("conditions"))}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
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

      <div className="space-y-4">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive === "on"}
            className="size-5 accent-gold"
          />
          Prestation visible sur le site
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="requiresValidation"
            defaultChecked={values.requiresValidation === "on"}
            className="size-5 accent-gold"
          />
          Réservation à valider manuellement
        </label>
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

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
