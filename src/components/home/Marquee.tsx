import { ScallopRing } from "@/components/brand/ScallopRing";
import { getHairCatalog } from "@/lib/catalog";

function Strip({ titles, hidden = false }: { titles: string[]; hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {titles.map((title) => (
        <li key={title} className="flex items-center">
          <span className="display whitespace-nowrap px-8 text-3xl italic md:text-5xl">{title}</span>
          <ScallopRing bumps={14} strokeWidth={2} className="size-6 shrink-0 md:size-8" />
        </li>
      ))}
    </ul>
  );
}

export async function Marquee() {
  const catalog = await getHairCatalog();
  const titles = catalog.flatMap((category) => category.services.map((service) => service.title));
  if (titles.length === 0) return null;

  return (
    <div className="relative z-10 -my-4 -rotate-1 scale-x-[1.04] md:-my-6">
      <div className="marquee overflow-hidden border-y border-ink/30 bg-gold py-5 text-ink md:py-7">
        <div className="marquee-track flex w-max">
          <Strip titles={titles} />
          <Strip titles={titles} hidden />
        </div>
      </div>
    </div>
  );
}
