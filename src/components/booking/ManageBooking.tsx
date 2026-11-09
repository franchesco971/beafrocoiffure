"use client";

import Link from "next/link";
import { useState } from "react";
import { Field } from "@/components/admin/Field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatTime } from "@/lib/date";
import { formatDuration, formatPrice } from "@/lib/format";
import { BOOKING_HREF } from "@/lib/site";
import type { PublicBooking } from "@/modules/booking/booking.service";
import { callApi } from "./api";
import { PRIMARY_BUTTON, TEXT_BUTTON } from "./styles";

const STATUS_LABELS: Record<PublicBooking["status"], string> = {
  PENDING: "En attente de validation",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  NO_SHOW: "Clôturé",
};

type Mode = "idle" | "confirm-cancel" | "change";

export function ManageBooking({ token, initial }: { token: string; initial: PublicBooking }) {
  const [booking, setBooking] = useState(initial);
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [sent, setSent] = useState(false);

  const active = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const total = booking.services.reduce((sum, service) => sum + (service.priceCents ?? 0), 0);
  const allPriced = booking.services.every((service) => service.priceCents !== null);

  async function send(body: { action: "cancel" } | { action: "change"; message: string }) {
    setPending(true);
    setError(null);
    const result = await callApi<PublicBooking>(`/api/bookings/${token}`, { method: "POST", body });
    setPending(false);

    if (!result.ok) {
      setError({
        text: result.fields?.message?.[0] ?? result.message,
        field: result.fields?.message ? "message" : undefined,
      });
      return;
    }
    setBooking(result.data);
    setMode("idle");
    setMessage("");
    setSent(body.action === "change");
  }

  return (
    <div>
      <p className="eyebrow">{STATUS_LABELS[booking.status]}</p>
      <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
        Bonjour <em>{booking.firstName}.</em>
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <section aria-label="Détail du rendez-vous" className="lg:col-span-7">
          <p className="display text-3xl text-bone first-letter:uppercase md:text-4xl">
            {formatDateTime(booking.startsAt)}
          </p>
          <p className="mt-2 text-bone-dim">Fin prévue vers {formatTime(booking.endsAt)}</p>

          <ul className="mt-8 border-t border-bone/15">
            {booking.services.map((service, index) => (
              <li key={index} className="flex items-baseline justify-between gap-6 border-b border-bone/15 py-4">
                <span className="text-bone">{service.title}</span>
                <span className="shrink-0 text-sm text-bone-dim">
                  {formatDuration(service.durationMin)} ·{" "}
                  {service.priceCents === null ? "Sur devis" : formatPrice(service.priceCents)}
                </span>
              </li>
            ))}
          </ul>
          {booking.services.length > 1 && (
            <p className="mt-4 text-right text-sm text-bone-dim">
              Total : {allPriced ? formatPrice(total) : "sur devis"}
            </p>
          )}
        </section>

        <section aria-label="Actions" className="lg:col-span-5">
          {booking.changeRequest && active && (
            <div role={sent ? "status" : undefined} className="mb-8 border-l-2 border-gold pl-5">
              <p className="text-bone">
                {sent ? "Demande de modification envoyée" : "Demande de modification en cours"}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm text-bone-dim">{booking.changeRequest}</p>
              <p className="mt-2 text-sm text-bone-dim">La coiffeuse reviendra vers vous.</p>
            </div>
          )}

          {booking.status === "CANCELLED" && (
            <div role="status">
              <p className="text-bone">Ce rendez-vous est annulé. Le créneau a été libéré.</p>
              <Link href={BOOKING_HREF} className={`${PRIMARY_BUTTON} mt-8`}>
                Prendre un nouveau rendez-vous
              </Link>
            </div>
          )}

          {active && !booking.canModify && (
            <p className="text-bone-dim">
              Le délai pour annuler ou modifier en ligne ({booking.cancelLimitHours} h avant le rendez-vous) est
              dépassé. Pour un imprévu, contactez directement le salon.
            </p>
          )}

          {active && booking.canModify && mode === "idle" && (
            <div className="flex flex-col items-start gap-6">
              <button type="button" onClick={() => setMode("change")} className={PRIMARY_BUTTON}>
                Demander une modification
              </button>
              <button type="button" onClick={() => setMode("confirm-cancel")} className={TEXT_BUTTON}>
                Annuler le rendez-vous
              </button>
            </div>
          )}

          {mode === "change" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send({ action: "change", message });
              }}
              className="space-y-5"
            >
              <Field
                label="Modification souhaitée"
                name="message"
                hint="Nouvelle date, autre horaire, changement de prestation…"
                errors={error?.field ? [error.text] : undefined}
              >
                <Textarea
                  id="message"
                  name="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={4}
                  aria-describedby="message-hint"
                />
              </Field>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
                  {pending ? "Envoi…" : "Envoyer la demande"}
                </button>
                <button type="button" onClick={() => setMode("idle")} className={TEXT_BUTTON}>
                  Retour
                </button>
              </div>
            </form>
          )}

          {mode === "confirm-cancel" && (
            <div role="alertdialog" aria-labelledby="cancel-title" className="space-y-5">
              <p id="cancel-title" className="text-bone">
                Annuler définitivement ce rendez-vous ?
              </p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void send({ action: "cancel" })}
                  className="rounded-full border border-ember px-7 py-4 text-sm font-medium uppercase tracking-[0.18em] text-ember transition-colors hover:bg-ember hover:text-ink disabled:opacity-40"
                >
                  {pending ? "Annulation…" : "Oui, annuler"}
                </button>
                <button type="button" onClick={() => setMode("idle")} className={TEXT_BUTTON}>
                  Garder mon rendez-vous
                </button>
              </div>
            </div>
          )}

          {error && !error.field && (
            <p role="alert" className="mt-6 text-sm text-destructive">
              {error.text}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
