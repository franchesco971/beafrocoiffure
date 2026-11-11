"use client";

import { useActionState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WELLNESS_OFFER_SLOTS } from "@/content/pages";
import type { FormState } from "@/lib/admin/forms";

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;

function Footer({ state, pending }: { state: FormState; pending: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button type="submit" disabled={pending} className="h-11 px-6">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
      {state.saved && (
        <p role="status" className="text-sm text-gold">
          Modifications enregistrées.
        </p>
      )}
    </div>
  );
}

const CONTACT_FIELDS = [
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "instagram", label: "Instagram", type: "url", hint: "Lien https de votre page." },
  { name: "facebook", label: "Facebook", type: "url", hint: "Lien https de votre page." },
  { name: "tiktok", label: "TikTok", type: "url", hint: "Lien https de votre page." },
] as const;

export function ContactContentForm({ action, defaults }: { action: Action; defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {CONTACT_FIELDS.map((field) => (
          <Field
            key={field.name}
            label={field.label}
            name={field.name}
            hint={"hint" in field ? field.hint : undefined}
            errors={errors[field.name]}
          >
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              defaultValue={values[field.name]}
              className="h-11"
              aria-invalid={invalid(field.name)}
              aria-describedby={describedBy(field.name, "hint" in field, invalid(field.name))}
            />
          </Field>
        ))}
      </div>
      <Field
        label="Lieu de prestation"
        name="address"
        hint="Adresse ou zone d’intervention (salon, domicile, itinérant…)."
        errors={errors.address}
      >
        <Textarea
          id="address"
          name="address"
          defaultValue={values.address}
          maxLength={300}
          rows={3}
          aria-invalid={invalid("address")}
          aria-describedby={describedBy("address", true, invalid("address"))}
        />
      </Field>
      <Footer state={state} pending={pending} />
    </form>
  );
}

export function LegalContentForm({
  action,
  contentKey,
  defaults,
}: {
  action: Action;
  contentKey: string;
  defaults: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const id = `body-${contentKey}`;
  const invalid = Boolean(errors.body?.[0]);

  return (
    <form action={formAction} className="space-y-6">
      <Field label="Texte" name={id} errors={errors.body}>
        <Textarea
          id={id}
          name="body"
          defaultValue={values.body}
          maxLength={30000}
          rows={18}
          className="font-mono text-sm"
          aria-invalid={invalid}
          aria-describedby={describedBy(id, false, invalid)}
        />
      </Field>
      <Footer state={state} pending={pending} />
    </form>
  );
}

export function WellnessContentForm({ action, defaults }: { action: Action; defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);

  return (
    <form action={formAction} className="space-y-6">
      <Field label="Introduction" name="intro" errors={errors.intro}>
        <Textarea
          id="intro"
          name="intro"
          defaultValue={values.intro}
          maxLength={1500}
          rows={3}
          aria-invalid={invalid("intro")}
          aria-describedby={describedBy("intro", false, invalid("intro"))}
        />
      </Field>

      <div className="space-y-6">
        {Array.from({ length: WELLNESS_OFFER_SLOTS }, (_, slot) => (
          <fieldset key={slot} className="space-y-4 rounded-2xl border border-bone/10 p-5">
            <legend className="px-2 text-xs uppercase tracking-[0.18em] text-bone-dim">Offre {slot + 1}</legend>
            <Field
              label="Titre"
              name={`offerTitle${slot}`}
              hint={slot >= 3 ? "Laisser vide pour ne pas afficher cette offre." : undefined}
              errors={errors[`offerTitle${slot}`]}
            >
              <Input
                id={`offerTitle${slot}`}
                name={`offerTitle${slot}`}
                defaultValue={values[`offerTitle${slot}`]}
                maxLength={80}
                className="h-11"
                aria-invalid={invalid(`offerTitle${slot}`)}
                aria-describedby={describedBy(`offerTitle${slot}`, slot >= 3, invalid(`offerTitle${slot}`))}
              />
            </Field>
            <Field label="Description" name={`offerText${slot}`} errors={errors[`offerText${slot}`]}>
              <Textarea
                id={`offerText${slot}`}
                name={`offerText${slot}`}
                defaultValue={values[`offerText${slot}`]}
                maxLength={600}
                rows={2}
                aria-invalid={invalid(`offerText${slot}`)}
                aria-describedby={describedBy(`offerText${slot}`, false, invalid(`offerText${slot}`))}
              />
            </Field>
          </fieldset>
        ))}
      </div>

      <p className="text-sm text-bone-dim">
        La mention « conseil non médical » est affichée en permanence sur la page et ne peut pas être retirée.
      </p>
      <Footer state={state} pending={pending} />
    </form>
  );
}
