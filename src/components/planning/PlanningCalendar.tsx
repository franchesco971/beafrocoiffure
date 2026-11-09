"use client";

import frLocale from "@fullcalendar/react/locales/fr";
import type { EventInput } from "@fullcalendar/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { moveBookingAction } from "@/app/admin/(panel)/planning/actions";
import { EventCalendar } from "@/components/event-calendar";

export type BusinessHours = { daysOfWeek: number[]; startTime: string; endTime: string };

const NEW_BOOKING_HREF = "/admin/planning/rendez-vous/nouveau";
const VIEWS = ["timeGridDay", "timeGridWeek", "dayGridMonth"];

async function fetchEvents(info: { startStr: string; endStr: string }): Promise<EventInput[]> {
  const query = new URLSearchParams({ start: info.startStr, end: info.endStr });
  const response = await fetch(`/api/admin/planning?${query}`);
  if (!response.ok) throw new Error("Impossible de charger le planning.");
  return response.json();
}

export function PlanningCalendar({
  initialDate,
  businessHours,
  slotMinTime,
  slotMaxTime,
}: {
  initialDate?: string;
  businessHours: BusinessHours[];
  slotMinTime: string;
  slotMaxTime: string;
}) {
  const router = useRouter();
  const [initialView, setInitialView] = useState<string | null>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const lastRequest = useRef(0);

  // La vue initiale dépend de la largeur de l'écran (jour sur mobile), inconnue au rendu serveur.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dépend de `window`
    setInitialView(window.matchMedia("(max-width: 767px)").matches ? "timeGridDay" : "timeGridWeek");
  }, []);

  // Source d'événements en tableau : une fonction déclenche une alerte React (FullCalendar #8092) sous <Suspense>.
  const loadEvents = async (range: { startStr: string; endStr: string }) => {
    const request = ++lastRequest.current;
    try {
      const loaded = await fetchEvents(range);
      if (request !== lastRequest.current) return;
      setEvents(loaded);
      setNotice(null);
    } catch (error) {
      if (request === lastRequest.current) setNotice(error instanceof Error ? error.message : "Erreur de chargement.");
    }
  };

  if (initialView === null) return <p className="text-bone-dim">Chargement du planning…</p>;

  return (
    <div className="space-y-4">
      {notice && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      <EventCalendar
        availableViews={VIEWS}
        initialView={initialView}
        initialDate={initialDate}
        locale={frLocale}
        timeZone="Europe/Paris"
        firstDay={1}
        height="75dvh"
        nowIndicator
        navLinks
        allDaySlot={false}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        businessHours={businessHours}
        events={events}
        datesSet={(info) => void loadEvents(info)}
        editable
        eventDurationEditable={false}
        addButton={{ text: "Nouveau rendez-vous", click: () => router.push(NEW_BOOKING_HREF) }}
        dateClick={(info) => {
          const [date, rest] = info.dateStr.split("T");
          const query = new URLSearchParams({ date });
          if (rest) query.set("time", rest.slice(0, 5));
          router.push(`${NEW_BOOKING_HREF}?${query}`);
        }}
        eventClick={(info) => {
          if (!info.event.url) return;
          info.jsEvent.preventDefault();
          router.push(info.event.url);
        }}
        eventDrop={async (info) => {
          const result = await moveBookingAction(info.event.extendedProps.bookingId, info.event.startStr);
          if (result.ok) setNotice(null);
          else {
            info.revert();
            setNotice(result.message);
          }
        }}
      />
    </div>
  );
}
