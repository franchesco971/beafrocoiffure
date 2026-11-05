import { Arrow } from "@/components/ui/Arrow";

const LABEL = "Prendre rendez-vous · Réservation en ligne · ";

export function SpinBadge({ href, className = "" }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      aria-label="Prendre rendez-vous"
      className={`group relative grid size-32 place-items-center rounded-full bg-gold text-ink shadow-[0_20px_60px_-15px_rgba(217,164,65,0.55)] transition-transform duration-500 ease-out-expo hover:scale-105 sm:size-40 ${className}`}
    >
      <svg viewBox="0 0 200 200" className="spin-badge absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <path id="badge-circle" d="M100 100m-76 0a76 76 0 1 1 152 0a76 76 0 1 1-152 0" />
        </defs>
        <text fill="currentColor" fontSize="14" fontWeight="500" letterSpacing="2.4">
          <textPath href="#badge-circle" textLength="474" lengthAdjust="spacing">
            {LABEL.toUpperCase()}
          </textPath>
        </text>
      </svg>
      <span className="relative grid size-12 place-items-center rounded-full bg-ink text-gold transition-transform duration-500 ease-out-expo group-hover:rotate-45 sm:size-14">
        <Arrow className="size-5" />
      </span>
    </a>
  );
}
