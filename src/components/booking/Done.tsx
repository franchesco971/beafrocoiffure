import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/ui/Arrow";
import { formatDateTime } from "@/lib/date";
import { PRIMARY_BUTTON, TEXT_BUTTON } from "./styles";
import type { CreatedBooking } from "./types";

export function Done({ booking, firstName }: { booking: CreatedBooking; firstName: string }) {
  const [copied, setCopied] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const confirmed = booking.status === "CONFIRMED";

  // Ramène la confirmation à l'écran (le formulaire était en bas de page) et l'annonce aux lecteurs d'écran.
  useEffect(() => container.current?.focus(), []);

  async function copyLink() {
    if (!booking.cancelPath) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${booking.cancelPath}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div ref={container} tabIndex={-1} role="status" className="outline-none">
      <p className="eyebrow">{confirmed ? "Rendez-vous confirmé" : "Demande enregistrée"}</p>
      <h2 className="display mt-5 text-4xl text-bone md:text-6xl">
        À très vite, <em>{firstName}.</em>
      </h2>
      <p className="mt-8 text-lg text-bone first-letter:uppercase">{formatDateTime(booking.startsAt)}</p>
      <p className="mt-4 max-w-[52ch] text-bone-dim">
        {confirmed
          ? "Votre créneau est réservé."
          : "Votre demande doit être validée par la coiffeuse : le créneau vous est réservé en attendant sa réponse."}
      </p>

      {booking.cancelPath && (
        <div className="mt-10 max-w-xl border-l-2 border-gold pl-5">
          <p className="text-bone">Gardez votre lien personnel</p>
          <p className="mt-2 text-sm text-bone-dim">
            Il permet de consulter votre rendez-vous, de l’annuler ou de demander une modification. Ne le partagez pas.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={booking.cancelPath} className={PRIMARY_BUTTON}>
              Voir mon rendez-vous
              <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
            </Link>
            <button type="button" onClick={copyLink} className={TEXT_BUTTON}>
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
