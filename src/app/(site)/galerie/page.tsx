import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { getGallery } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Locks, MicroLocks, soins capillaires, coiffures naturelles et transformations avant/après.",
  alternates: { canonical: "/galerie" },
};

export default async function GalleryPage() {
  const { categories, items } = await getGallery();

  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <header className="max-w-3xl">
          <p className="eyebrow">Galerie</p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
            Nos <em>réalisations.</em>
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg text-bone-dim">
            Locks, MicroLocks, soins et coiffures naturelles : des résultats qui respectent chaque texture.
          </p>
        </header>

        <div className="mt-16 lg:mt-24">
          {items.length > 0 ? (
            <GalleryGrid categories={categories} items={items} />
          ) : (
            <p className="text-bone-dim">La galerie sera bientôt en ligne.</p>
          )}
        </div>
      </div>
    </section>
  );
}
