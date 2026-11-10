import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { deleteGalleryCategory, deleteMedia, saveGalleryCategory, updateMedia } from "./actions";
import { GalleryCategoryForm } from "./gallery-category-form";
import { MediaEditForm } from "./media-edit-form";
import { MediaUploadForm } from "./media-upload-form";

export const metadata: Metadata = { title: "Galerie" };

export default function GalleryAdminPage() {
  return (
    <AdminPage title="Galerie">
      <Suspense fallback={<AdminLoading />}>
        <Gallery />
      </Suspense>
    </AdminPage>
  );
}

function Thumb({ url, type, alt }: { url: string; type: "IMAGE" | "VIDEO"; alt: string }) {
  return type === "VIDEO" ? (
    <video src={`${url}#t=0.1`} preload="metadata" muted playsInline controls className="size-full object-cover" />
  ) : (
    <Image src={url} alt={alt} fill unoptimized sizes="160px" className="object-cover" />
  );
}

async function Gallery() {
  await requireRole("ADMIN");
  const [categories, media] = await Promise.all([
    db.galleryCategory.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      include: { _count: { select: { media: true } } },
    }),
    db.media.findMany({ orderBy: [{ position: "asc" }, { id: "desc" }] }),
  ]);
  const options = categories.map(({ id, name }) => ({ id, name }));

  return (
    <div className="space-y-16">
      <section aria-labelledby="ajout">
        <h2 id="ajout" className="display text-3xl text-bone">
          Ajouter
        </h2>
        <div className="mt-6 rounded-2xl border border-bone/10 bg-ink-2 p-6">
          <MediaUploadForm categories={options} />
        </div>
      </section>

      <section aria-labelledby="medias">
        <h2 id="medias" className="display text-3xl text-bone">
          Photos et vidéos <span className="text-lg text-bone-dim">({media.length})</span>
        </h2>
        <p className="mt-2 text-sm text-bone-dim">
          Les médias sont triés par ordre d’affichage croissant, puis du plus récent au plus ancien.
        </p>

        {media.length === 0 ? (
          <p className="mt-6 text-bone-dim">Aucun média pour le moment.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {media.map((item) => (
              <li
                key={item.id}
                className="grid gap-5 rounded-2xl border border-bone/10 bg-ink-2 p-4 sm:grid-cols-[10rem_1fr]"
              >
                <div className="space-y-2">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-3">
                    <Thumb url={item.url} type={item.type} alt={item.alt ?? "Aperçu"} />
                  </div>
                  {item.beforeUrl && (
                    <>
                      <p className="text-xs uppercase tracking-[0.18em] text-bone-dim">Avant</p>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-3">
                        <Thumb url={item.beforeUrl} type="IMAGE" alt="Photo avant" />
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-5">
                  <MediaEditForm
                    action={updateMedia.bind(null, item.id)}
                    categories={options}
                    defaults={{
                      alt: item.alt ?? "",
                      categoryId: item.galleryCategoryId === null ? "" : String(item.galleryCategoryId),
                      position: String(item.position),
                    }}
                  />
                  <DeleteForm
                    action={deleteMedia.bind(null, item.id)}
                    label="Supprimer"
                    confirmMessage="Supprimer définitivement ce média ?"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="categories">
        <h2 id="categories" className="display text-3xl text-bone">
          Catégories
        </h2>
        <ul className="mt-6 space-y-6">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
              <div className="space-y-2">
                <GalleryCategoryForm
                  action={saveGalleryCategory.bind(null, category.id)}
                  defaults={{ name: category.name, position: String(category.position) }}
                  submitLabel="Enregistrer"
                />
                <p className="text-xs text-bone-dim">{category._count.media} média(s)</p>
              </div>
              <DeleteForm
                action={deleteGalleryCategory.bind(null, category.id)}
                label="Supprimer"
                confirmMessage={`Supprimer la catégorie « ${category.name} » ? Ses médias sont conservés, sans catégorie.`}
              />
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-bone/10 pt-6">
          <p className="eyebrow mb-3">Nouvelle catégorie</p>
          <GalleryCategoryForm
            action={saveGalleryCategory.bind(null, null)}
            defaults={{ name: "", position: String(categories.length + 1) }}
            submitLabel="Ajouter"
          />
        </div>
      </section>
    </div>
  );
}
