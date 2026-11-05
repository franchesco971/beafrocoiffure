import { ScallopRing } from "@/components/brand/ScallopRing";
import { HAIR_SERVICES } from "@/content/services";

function Strip({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {HAIR_SERVICES.map((service) => (
        <li key={service.title} className="flex items-center">
          <span className="display whitespace-nowrap px-8 text-3xl italic md:text-5xl">{service.title}</span>
          <ScallopRing bumps={14} strokeWidth={2} className="size-6 shrink-0 md:size-8" />
        </li>
      ))}
    </ul>
  );
}

export function Marquee() {
  return (
    <div className="relative z-10 -my-4 -rotate-1 scale-x-[1.04] md:-my-6">
      <div className="marquee overflow-hidden border-y border-ink/30 bg-gold py-5 text-ink md:py-7">
        <div className="marquee-track flex w-max">
          <Strip />
          <Strip hidden />
        </div>
      </div>
    </div>
  );
}
