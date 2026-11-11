"use client";

import type { FormEvent } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { PRIMARY_BUTTON } from "@/components/booking/styles";
import { Honeypot, PrivacyLink } from "@/components/forms/fields";
import { Turnstile } from "@/components/forms/Turnstile";
import { generalError, useApiSubmit } from "@/components/forms/useApiSubmit";
import { Arrow } from "@/components/ui/Arrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = ["author", "rating", "text"] as const;

export function ReviewForm() {
  const { submit, pending, failure, data, captcha } = useApiSubmit("/api/reviews");
  const errors = failure?.fields ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);
  const general = generalError(failure, FIELDS);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const rating = values.get("rating");
    const ok = await submit({
      author: values.get("author"),
      rating: rating === null ? null : Number(rating),
      text: values.get("text"),
      website: values.get("website"),
    });
    if (ok) form.reset();
  }

  if (data) {
    return (
      <div role="status" className="rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-10">
        <p className="display text-3xl text-bone">Merci pour votre avis.</p>
        <p className="mt-4 max-w-[44ch] text-bone-dim">Il sera publié après relecture.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <Field label="Prénom" name="author" hint="Affiché avec votre avis." errors={errors.author}>
        <Input
          id="author"
          name="author"
          required
          maxLength={60}
          autoComplete="given-name"
          className="h-12"
          aria-invalid={invalid("author")}
          aria-describedby={describedBy("author", true, invalid("author"))}
        />
      </Field>

      <fieldset aria-describedby={invalid("rating") ? "rating-error" : undefined}>
        <legend className="mb-2 text-sm font-medium">Note</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="rating" value={value} required className="peer sr-only" />
              <span className="flex h-12 w-14 items-center justify-center gap-1 rounded-full border border-bone/20 text-bone-dim transition-colors hover:border-gold peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60">
                {value}
                <span aria-hidden="true">★</span>
              </span>
            </label>
          ))}
        </div>
        {errors.rating?.[0] && (
          <p id="rating-error" role="alert" className="mt-2 text-sm text-destructive">
            {errors.rating[0]}
          </p>
        )}
      </fieldset>

      <Field label="Votre avis" name="text" errors={errors.text}>
        <Textarea
          id="text"
          name="text"
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          aria-invalid={invalid("text")}
          aria-describedby={describedBy("text", false, invalid("text"))}
        />
      </Field>

      <Honeypot />

      <p className="text-sm text-bone-dim">
        Votre prénom et votre avis seront publiés sur le site après relecture. Aucune autre donnée n’est enregistrée :
        voir la <PrivacyLink />.
      </p>

      <Turnstile {...captcha.widgetProps} />

      {general && (
        <p role="alert" className="text-sm text-destructive">
          {general}
        </p>
      )}

      <button type="submit" disabled={pending || !captcha.ready} className={PRIMARY_BUTTON}>
        {pending ? "Envoi…" : "Publier mon avis"}
        <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
      </button>
    </form>
  );
}
