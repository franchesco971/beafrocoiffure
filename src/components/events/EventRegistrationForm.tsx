"use client";

import type { FormEvent } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { PRIMARY_BUTTON } from "@/components/booking/styles";
import { ConsentField, Honeypot } from "@/components/forms/fields";
import { generalError, useApiSubmit } from "@/components/forms/useApiSubmit";
import { Arrow } from "@/components/ui/Arrow";
import { Input } from "@/components/ui/input";

const FIELDS = ["name", "email", "phone", "consent"] as const;

export function EventRegistrationForm({ eventId }: { eventId: number }) {
  const { submit, pending, failure, data } = useApiSubmit(`/api/events/${eventId}/register`);
  const errors = failure?.fields ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);
  const general = generalError(failure, FIELDS);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    await submit({
      name: values.get("name"),
      email: values.get("email"),
      phone: values.get("phone"),
      consent: values.get("consent") === "on",
      website: values.get("website"),
    });
  }

  if (data) {
    return (
      <div role="status">
        <p className="display text-3xl text-bone">Inscription enregistrée.</p>
        <p className="mt-3 text-bone-dim">Votre place est réservée : à très vite !</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Nom" name="name" errors={errors.name}>
        <Input
          id="name"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          className="h-12"
          aria-invalid={invalid("name")}
          aria-describedby={describedBy("name", false, invalid("name"))}
        />
      </Field>
      <Field label="E-mail" name="email" errors={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="h-12"
          aria-invalid={invalid("email")}
          aria-describedby={describedBy("email", false, invalid("email"))}
        />
      </Field>
      <Field label="Téléphone (facultatif)" name="phone" errors={errors.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          maxLength={20}
          autoComplete="tel"
          className="h-12"
          aria-invalid={invalid("phone")}
          aria-describedby={describedBy("phone", false, invalid("phone"))}
        />
      </Field>

      <Honeypot />

      <ConsentField error={errors.consent?.[0]}>
        J’accepte que mes données soient enregistrées pour gérer mon inscription à cet événement.
      </ConsentField>

      {general && (
        <p role="alert" className="text-sm text-destructive">
          {general}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON} w-full`}>
        {pending ? "Envoi…" : "Je m’inscris"}
        <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
      </button>
    </form>
  );
}
