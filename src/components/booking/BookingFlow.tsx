"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BookableCatalog } from "@/lib/catalog";
import { dateKeyOf, shiftMonth } from "@/lib/date";
import { callApi, type ApiFailure } from "./api";
import { ContactStep } from "./ContactStep";
import { Done } from "./Done";
import { ServiceStep } from "./ServiceStep";
import { SlotStep } from "./SlotStep";
import { TEXT_BUTTON } from "./styles";
import { Summary } from "./Summary";
import { EMPTY_CONTACT, type Contact, type CreatedBooking } from "./types";

type Step = "services" | "slot" | "contact" | "done";

const STEPS = [
  { id: "services", label: "Prestations" },
  { id: "slot", label: "Créneau" },
  { id: "contact", label: "Coordonnées" },
] as const;

const TITLES: Record<Step, string> = {
  services: "Que souhaitez-vous réserver ?",
  slot: "Quand vous convient-il ?",
  contact: "Qui êtes-vous ?",
  done: "",
};

// Si le mois affiché est complet, on cherche automatiquement le premier mois qui ne l'est pas.
const MONTHS_TO_SEEK = 4;

export function BookingFlow({ catalog, initialServiceIds }: { catalog: BookableCatalog; initialServiceIds: number[] }) {
  const services = useMemo(() => catalog.flatMap((category) => category.services), [catalog]);
  const [selected, setSelected] = useState<number[]>(initialServiceIds);
  const [step, setStep] = useState<Step>("services");

  const [currentMonth, setCurrentMonth] = useState("");
  const [month, setMonth] = useState("");
  const [days, setDays] = useState<Record<string, string[]> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [created, setCreated] = useState<CreatedBooking | null>(null);

  const latestRequest = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);

  const chosen = services.filter((service) => selected.includes(service.id));

  // Le focus suit le changement d'étape (lecteurs d'écran, clavier).
  useEffect(() => {
    if (step !== "services") heading.current?.focus();
  }, [step]);

  async function loadMonth(ids: number[], target: string, seek: boolean) {
    const request = ++latestRequest.current;
    setDay(null);
    setSlot(null);
    setLoadError(null);

    let current = target;
    for (let attempt = 0; attempt < (seek ? MONTHS_TO_SEEK : 1); attempt++) {
      setMonth(current);
      setDays(null);
      const result = await callApi<{ days: Record<string, string[]> }>(
        `/api/availability?services=${ids.join(",")}&month=${current}`,
      );
      if (request !== latestRequest.current) return;
      if (!result.ok) {
        setLoadError(result.message);
        setDays({});
        return;
      }
      const lastAttempt = !seek || attempt === MONTHS_TO_SEEK - 1;
      if (lastAttempt || Object.keys(result.data.days).length > 0) {
        setDays(result.data.days);
        return;
      }
      current = shiftMonth(current, 1);
    }
  }

  function toggleService(id: number) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));
    setDay(null);
    setSlot(null);
  }

  function goToSlots() {
    const thisMonth = dateKeyOf(new Date()).slice(0, 7);
    setCurrentMonth(thisMonth);
    setNotice(null);
    setStep("slot");
    void loadMonth(selected, thisMonth, true);
  }

  function chooseMonth(target: string) {
    void loadMonth(selected, target, false);
  }

  function goBackTo(target: Step) {
    if (target === "services") latestRequest.current++;
    setStep(target);
  }

  async function submit() {
    if (!slot) return;
    setPending(true);
    setFailure(null);

    const { notes, ...rest } = contact;
    const result = await callApi<CreatedBooking>("/api/bookings", {
      method: "POST",
      body: { ...rest, notes: notes || undefined, serviceIds: selected, startsAt: slot },
    });
    setPending(false);

    if (result.ok) {
      setCreated(result.data);
      setStep("done");
      return;
    }
    if (result.code === "slot_unavailable") {
      setNotice("Ce créneau vient d’être pris par quelqu’un d’autre. Choisissez-en un nouveau.");
      setStep("slot");
      void loadMonth(selected, month, false);
      return;
    }
    if (result.code === "services_unavailable") {
      setNotice(result.message);
      setSelected([]);
      setStep("services");
      return;
    }
    setFailure(result);
  }

  if (step === "done" && created) {
    return <Done booking={created} firstName={contact.firstName.trim()} />;
  }

  const stepIndex = STEPS.findIndex(({ id }) => id === step);

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-8">
        <ol className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Étapes de la réservation">
          {STEPS.map(({ id, label }, index) => {
            const reachable = index < stepIndex;
            const content = (
              <>
                <span className="display mr-2 text-2xl italic">{index + 1}</span>
                <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
              </>
            );
            return (
              <li key={id} aria-current={index === stepIndex ? "step" : undefined}>
                {reachable ? (
                  <button
                    type="button"
                    onClick={() => goBackTo(id)}
                    className="text-bone transition-colors hover:text-gold"
                  >
                    {content}
                  </button>
                ) : (
                  <span className={index === stepIndex ? "text-gold" : "text-bone-dim/60"}>{content}</span>
                )}
              </li>
            );
          })}
        </ol>

        <h2 ref={heading} tabIndex={-1} className="display mt-8 text-4xl text-bone outline-none md:text-5xl">
          {TITLES[step]}
        </h2>

        <div className="mt-8">
          {step === "services" && (
            <>
              {notice && (
                <p role="alert" className="mb-8 border-l-2 border-ember pl-5 text-bone">
                  {notice}
                </p>
              )}
              <ServiceStep catalog={catalog} selected={selected} onToggle={toggleService} onNext={goToSlots} />
            </>
          )}
          {step === "slot" && (
            <SlotStep
              month={month}
              currentMonth={currentMonth}
              days={days}
              error={loadError}
              notice={notice}
              day={day}
              slot={slot}
              onMonth={chooseMonth}
              onDay={(key) => {
                setDay(key);
                setSlot(null);
              }}
              onSlot={setSlot}
              onNext={() => {
                setNotice(null);
                setStep("contact");
              }}
            />
          )}
          {step === "contact" && (
            <ContactStep
              contact={contact}
              onChange={(patch) => setContact((previous) => ({ ...previous, ...patch }))}
              onSubmit={submit}
              pending={pending}
              failure={failure}
              requiresValidation={chosen.some((service) => service.requiresValidation)}
            />
          )}
        </div>

        {step !== "services" && (
          <button
            type="button"
            onClick={() => goBackTo(step === "contact" ? "slot" : "services")}
            className={`${TEXT_BUTTON} mt-10`}
          >
            ← Retour
          </button>
        )}
      </div>

      <div className="lg:col-span-4">
        <Summary services={chosen} slot={step === "services" ? null : slot} />
      </div>
    </div>
  );
}
