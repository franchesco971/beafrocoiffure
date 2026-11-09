"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Arrow } from "@/components/ui/Arrow";
import { BOOKING_HREF } from "@/lib/site";

export function StickyBook() {
  // Inutile (et gênant pour le formulaire) sur le tunnel de réservation lui-même.
  if (usePathname().startsWith(BOOKING_HREF)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-ink via-ink/80 to-transparent px-5 pb-5 pt-10 sm:hidden">
      <Link
        href={BOOKING_HREF}
        className="pointer-events-auto flex items-center justify-center gap-3 rounded-full bg-gold py-4 text-sm font-medium uppercase tracking-[0.2em] text-ink shadow-[0_12px_40px_-10px_rgba(217,164,65,0.6)]"
      >
        Prendre rendez-vous
        <Arrow />
      </Link>
    </div>
  );
}
