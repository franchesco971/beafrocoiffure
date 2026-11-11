"use client";

import { useActionState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/admin/forms";
import { RULE_LIMITS } from "@/modules/booking/rules";
import { RETENTION_LIMITS } from "@/modules/privacy/retention";

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;

function Footer({ state, pending, label = "Enregistrer" }: { state: FormState; pending: boolean; label?: string }) {
  return (
    <>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Enregistrement…" : label}
        </Button>
        {state.saved && (
          <p role="status" className="text-sm text-gold">
            Modifications enregistrées.
          </p>
        )}
      </div>
    </>
  );
}

const RULE_FIELDS = [
  { name: "bufferMinutes", label: "Pause entre deux prestations (minutes)", hint: "Incluse dans le temps occupé." },
  { name: "minNoticeHours", label: "Délai minimum avant un rendez-vous (heures)" },
  { name: "slotStepMinutes", label: "Pas des créneaux (minutes)", hint: "Écart entre deux horaires proposés." },
  {
    name: "cancelLimitHours",
    label: "Annulation possible jusqu’à (heures avant)",
    hint: "Au-delà, le client doit vous contacter.",
  },
  { name: "maxAdvanceDays", label: "Réservation possible jusqu’à (jours)", hint: "Horizon du calendrier en ligne." },
] as const;

export function BookingRulesForm({ action, defaults }: { action: Action; defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {RULE_FIELDS.map((field) => {
          const invalid = Boolean(errors[field.name]?.[0]);
          const hint = "hint" in field ? field.hint : undefined;
          return (
            <Field key={field.name} label={field.label} name={field.name} hint={hint} errors={errors[field.name]}>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                inputMode="numeric"
                min={RULE_LIMITS[field.name].min}
                max={RULE_LIMITS[field.name].max}
                defaultValue={values[field.name]}
                required
                className="h-11"
                aria-invalid={invalid}
                aria-describedby={describedBy(field.name, Boolean(hint), invalid)}
              />
            </Field>
          );
        })}
      </div>
      <Footer state={state} pending={pending} />
    </form>
  );
}

export function AdminEmailForm({ action, defaults }: { action: Action; defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const invalid = Boolean(errors.adminEmail?.[0]);

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="E-mail de l’administrateur"
        name="adminEmail"
        hint="Reçoit les notifications de nouvelle réservation et d’annulation."
        errors={errors.adminEmail}
      >
        <Input
          id="adminEmail"
          name="adminEmail"
          type="email"
          defaultValue={values.adminEmail}
          maxLength={254}
          className="h-11 max-w-md"
          aria-invalid={invalid}
          aria-describedby={describedBy("adminEmail", true, invalid)}
        />
      </Field>
      <Footer state={state} pending={pending} />
    </form>
  );
}

export function RetentionForm({ action, defaults }: { action: Action; defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const invalid = Boolean(errors.retentionMonths?.[0]);

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Durée de conservation (mois)"
        name="retentionMonths"
        hint="Après le dernier rendez-vous, message ou événement. Gardez la politique de confidentialité cohérente avec cette durée."
        errors={errors.retentionMonths}
      >
        <Input
          id="retentionMonths"
          name="retentionMonths"
          type="number"
          inputMode="numeric"
          min={RETENTION_LIMITS.min}
          max={RETENTION_LIMITS.max}
          defaultValue={values.retentionMonths}
          required
          className="h-11 max-w-xs"
          aria-invalid={invalid}
          aria-describedby={describedBy("retentionMonths", true, invalid)}
        />
      </Field>
      <Footer state={state} pending={pending} />
    </form>
  );
}

export function PurgeForm({ action, expiredCount }: { action: Action; expiredCount: number }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Anonymiser ou supprimer maintenant les données arrivées au terme de la conservation ?")) {
          event.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <Button type="submit" variant="destructive" disabled={pending || expiredCount === 0} className="h-11 px-5">
        {pending ? "Purge…" : "Purger maintenant"}
      </Button>
      {state.message && (
        <p role="status" className="text-sm text-gold">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function PasswordForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};

  const field = (name: string, label: string, autoComplete: string, hint?: string) => {
    const invalid = Boolean(errors[name]?.[0]);
    return (
      <Field label={label} name={name} hint={hint} errors={errors[name]}>
        <Input
          // Une clé qui change à chaque succès vide les champs.
          key={state.saved ? `${name}-saved` : name}
          id={name}
          name={name}
          type="password"
          autoComplete={autoComplete}
          required
          maxLength={256}
          className="h-11"
          aria-invalid={invalid}
          aria-describedby={describedBy(name, Boolean(hint), invalid)}
        />
      </Field>
    );
  };

  return (
    <form action={formAction} className="max-w-md space-y-6">
      {field("currentPassword", "Mot de passe actuel", "current-password")}
      {field("newPassword", "Nouveau mot de passe", "new-password", "12 caractères minimum.")}
      {field("confirmPassword", "Confirmation du nouveau mot de passe", "new-password")}
      <Footer state={state} pending={pending} label="Changer le mot de passe" />
    </form>
  );
}
