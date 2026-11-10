"use client";

import type { FormEvent } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { PRIMARY_BUTTON } from "@/components/booking/styles";
import { ConsentField, Honeypot } from "@/components/forms/fields";
import { generalError, useApiSubmit } from "@/components/forms/useApiSubmit";
import { Arrow } from "@/components/ui/Arrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = ["name", "email", "message", "consent"] as const;

export function ContactForm() {
  const { submit, pending, failure, data } = useApiSubmit("/api/contact");
  const errors = failure?.fields ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);
  const general = generalError(failure, FIELDS);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const ok = await submit({
      name: values.get("name"),
      email: values.get("email"),
      message: values.get("message"),
      consent: values.get("consent") === "on",
      website: values.get("website"),
    });
    if (ok) form.reset();
  }

  if (data) {
    return (
      <div role="status" className="rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-10">
        <p className="display text-3xl text-bone">Message envoyé.</p>
        <p className="mt-4 max-w-[44ch] text-bone-dim">
          Merci, nous vous répondons dès que possible à l’adresse e-mail indiquée.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div className="grid gap-6 md:grid-cols-2">
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
      </div>

      <Field label="Message" name="message" errors={errors.message}>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          aria-invalid={invalid("message")}
          aria-describedby={describedBy("message", false, invalid("message"))}
        />
      </Field>

      <Honeypot />

      <ConsentField error={errors.consent?.[0]}>
        J’accepte que mes données soient utilisées pour répondre à ma demande.
      </ConsentField>

      {general && (
        <p role="alert" className="text-sm text-destructive">
          {general}
        </p>
      )}

      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? "Envoi…" : "Envoyer le message"}
        <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
      </button>
    </form>
  );
}
