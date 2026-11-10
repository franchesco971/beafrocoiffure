"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";

type Category = { id: number; name: string };

const chip = (active: boolean) =>
  `rounded-full border px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
    active ? "border-gold bg-gold text-ink" : "border-bone/20 text-bone-dim hover:border-gold hover:text-bone"
  }`;

export function GalleryGrid({ categories, items }: { categories: Category[]; items: GalleryItem[] }) {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState<GalleryItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const visible = categoryId === null ? items : items.filter((item) => item.galleryCategoryId === categoryId);

  return (
    <>
      {categories.length > 0 && (
        <div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-3">
          <button
            type="button"
            aria-pressed={categoryId === null}
            onClick={() => setCategoryId(null)}
            className={chip(categoryId === null)}
          >
            Tout
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
              className={chip(categoryId === category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => {
          const label = item.alt ?? "Réalisation BeAfro Coiffure";

          if (item.beforeUrl) {
            return (
              <li key={item.id} className="grid grid-cols-2 gap-1 sm:col-span-2">
                {[
                  { url: item.beforeUrl, title: "Avant" },
                  { url: item.url, title: "Après" },
                ].map(({ url, title }) => (
                  <figure key={title} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-2">
                    <Image
                      src={url}
                      alt={`${label} — ${title.toLowerCase()}`}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover"
                    />
                    <figcaption className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-bone">
                      {title}
                    </figcaption>
                  </figure>
                ))}
              </li>
            );
          }

          if (item.type === "VIDEO") {
            return (
              <li key={item.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-2">
                <video controls preload="metadata" playsInline aria-label={label} className="size-full object-cover">
                  <source src={item.url} />
                </video>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <button
                type="button"
                aria-label={`Agrandir : ${label}`}
                onClick={() => {
                  setZoomed(item);
                  dialog.current?.showModal();
                }}
                className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-ink-2"
              >
                <Image
                  src={item.url}
                  alt={label}
                  fill
                  unoptimized
                  loading={index < 3 ? "eager" : "lazy"}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && <p className="mt-10 text-bone-dim">Aucune réalisation dans cette catégorie.</p>}

      <dialog
        ref={dialog}
        aria-label="Photo agrandie"
        onClose={() => setZoomed(null)}
        onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
        className="m-auto max-h-[92dvh] max-w-[94vw] bg-transparent p-0 text-bone backdrop:bg-ink/90 backdrop:backdrop-blur-sm"
      >
        {zoomed && (
          <div className="relative">
            <Image
              src={zoomed.url}
              alt={zoomed.alt ?? "Réalisation BeAfro Coiffure"}
              width={1600}
              height={1600}
              unoptimized
              className="h-auto max-h-[88dvh] w-auto max-w-[94vw] rounded-2xl object-contain"
            />
            <button
              type="button"
              autoFocus
              onClick={() => dialog.current?.close()}
              className="absolute right-3 top-3 rounded-full bg-ink/80 px-4 py-2 text-xs uppercase tracking-[0.18em] text-bone transition-colors hover:text-gold"
            >
              Fermer
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
