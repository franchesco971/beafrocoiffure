"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/admin/forms";
import { formatDuration } from "@/lib/format";

type ServiceGroup = { id: number; name: string; services: { id: number; title: string; durationMin: number }[] };
type ClientSummary = { id: number; name: string; phone: string; email: string | null };

/** Sections propres à la création : choix des prestations et de la cliente. */
export type CreateOptions = { groups: ServiceGroup[]; client: ClientSummary | null };

export function BookingForm({
  action,
  defaults,
  statuses,
  create,
  cancelHref,
  cancelLabel = "Annuler",
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  defaults: Record<string, string>;
  statuses: { value: string; label: string }[];
  create?: CreateOptions;
  cancelHref: string;
  cancelLabel?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  const errors = state.errors ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);
  const aria = (name: string, hasHint = false) => ({
    "aria-invalid": invalid(name),
    "aria-describedby": describedBy(name, hasHint, invalid(name)),
  });
  const selected = new Set((values.serviceIds ?? "").split(",").filter(Boolean));

  return (
    <form action={formAction} className="space-y-10">
      {create && (
        <>
          <fieldset className="space-y-6" aria-describedby={invalid("serviceIds") ? "serviceIds-error" : undefined}>
            <legend className="eyebrow">Prestations</legend>
            <div className="grid gap-x-3 gap-y-3 md:grid-cols-2">
              {create.groups.map((group) => {
                // Les catégories d'origine portent le nom de leur unique prestation : inutile de le répéter.
                const redundant = group.services.length === 1 && group.services[0].title === group.name;
                return (
                  <div key={group.id} className="space-y-2">
                    {!redundant && <h2 className="text-sm text-bone-dim">{group.name}</h2>}
                    <ul className="space-y-2">
                      {group.services.map((service) => (
                        <li key={service.id}>
                          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-bone/10 px-3 py-2 text-sm has-checked:border-gold/60 has-checked:bg-gold/5">
                            <input
                              type="checkbox"
                              name="serviceIds"
                              value={service.id}
                              defaultChecked={selected.has(String(service.id))}
                              className="size-5 accent-gold"
                            />
                            <span className="grow">{service.title}</span>
                            <span className="text-bone-dim">{formatDuration(service.durationMin)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            {errors.serviceIds?.[0] && (
              <p id="serviceIds-error" role="alert" className="text-sm text-destructive">
                {errors.serviceIds[0]}
              </p>
            )}
          </fieldset>

          <fieldset className="space-y-6">
            <legend className="eyebrow">Cliente</legend>
            {create.client ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-bone/10 px-4 py-3">
                <input type="hidden" name="clientId" value={create.client.id} />
                <div>
                  <p className="text-bone">{create.client.name}</p>
                  <p className="text-sm text-bone-dim">
                    {[create.client.phone, create.client.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Link
                  href="/admin/planning/rendez-vous/nouveau"
                  className="text-sm text-gold transition-colors hover:text-bone"
                >
                  Autre cliente
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Prénom" name="firstName" errors={errors.firstName}>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={values.firstName}
                      maxLength={80}
                      autoComplete="off"
                      className="h-11"
                      {...aria("firstName")}
                    />
                  </Field>
                  <Field label="Nom" name="lastName" errors={errors.lastName}>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={values.lastName}
                      maxLength={80}
                      autoComplete="off"
                      className="h-11"
                      {...aria("lastName")}
                    />
                  </Field>
                  <Field label="Téléphone" name="phone" errors={errors.phone}>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={values.phone}
                      maxLength={20}
                      autoComplete="off"
                      className="h-11"
                      {...aria("phone")}
                    />
                  </Field>
                  <Field
                    label="E-mail"
                    name="email"
                    hint="Facultatif. Une cliente déjà enregistrée avec cette adresse est retrouvée."
                    errors={errors.email}
                  >
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={values.email}
                      maxLength={254}
                      autoComplete="off"
                      className="h-11"
                      {...aria("email", true)}
                    />
                  </Field>
                </div>
                <p className="text-sm text-bone-dim">
                  Cliente déjà connue ?{" "}
                  <Link href="/admin/clients" className="text-gold transition-colors hover:text-bone">
                    Ouvrez sa fiche
                  </Link>{" "}
                  pour lui ajouter un rendez-vous.
                </p>
              </>
            )}
          </fieldset>
        </>
      )}

      <fieldset className="space-y-6">
        <legend className="eyebrow">Rendez-vous</legend>
        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Date" name="date" errors={errors.date}>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={values.date}
              required
              className="h-11"
              {...aria("date")}
            />
          </Field>
          <Field label="Heure de début" name="time" errors={errors.time}>
            <Input
              id="time"
              name="time"
              type="time"
              step={300}
              defaultValue={values.time}
              required
              className="h-11"
              {...aria("time")}
            />
          </Field>
          <Field label="Statut" name="status" errors={errors.status}>
            <NativeSelect key={values.status} id="status" name="status" defaultValue={values.status}>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Lieu" name="locationType" errors={errors.locationType}>
            <NativeSelect
              key={values.locationType}
              id="locationType"
              name="locationType"
              defaultValue={values.locationType}
            >
              <option value="">Non précisé</option>
              <option value="SALON">Au salon</option>
              <option value="HOME">À domicile</option>
              <option value="MOBILE">Déplacement</option>
            </NativeSelect>
          </Field>
          <Field
            label="Adresse"
            name="address"
            hint="Pour une prestation à domicile ou en déplacement."
            errors={errors.address}
          >
            <Input
              id="address"
              name="address"
              defaultValue={values.address}
              maxLength={300}
              className="h-11"
              {...aria("address", true)}
            />
          </Field>
        </div>
        <Field label="Notes" name="notes" hint="Visibles uniquement dans l'administration." errors={errors.notes}>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={values.notes}
            maxLength={500}
            rows={3}
            {...aria("notes", true)}
          />
        </Field>
      </fieldset>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
        <Link href={cancelHref} className="text-sm text-bone-dim transition-colors hover:text-bone">
          {cancelLabel}
        </Link>
      </div>
    </form>
  );
}
