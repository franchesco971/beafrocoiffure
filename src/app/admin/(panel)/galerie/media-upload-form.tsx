"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, describedBy } from "@/components/admin/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

type Failure = { message: string; fields?: Record<string, string[] | undefined> };

export function MediaUploadForm({ categories }: { categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [added, setAdded] = useState(false);
  const errors = failure?.fields ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setFailure(null);
    setAdded(false);

    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: new FormData(form) });
      if (response.ok) {
        form.reset();
        setAdded(true);
        router.refresh();
        return;
      }
      const body = await response.json().catch(() => null);
      setFailure({ message: body?.message ?? "Le téléversement a échoué.", fields: body?.fields });
    } catch {
      setFailure({ message: "Connexion impossible. Vérifiez votre réseau et réessayez." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Photo ou vidéo"
          name="file"
          hint="JPEG, PNG ou WebP (15 Mo maximum), MP4 ou WebM (50 Mo maximum)."
          errors={errors.file}
        >
          <Input
            id="file"
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            className="h-11 pt-2"
            aria-invalid={invalid("file")}
            aria-describedby={describedBy("file", true, invalid("file"))}
          />
        </Field>
        <Field
          label="Photo « avant » (facultatif)"
          name="before"
          hint="Ajoutez-la pour créer un avant/après : la photo principale devient la photo « après »."
        >
          <Input
            id="before"
            name="before"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="h-11 pt-2"
            aria-describedby="before-hint"
          />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Catégorie" name="categoryId" errors={errors.categoryId}>
          <NativeSelect
            id="categoryId"
            name="categoryId"
            defaultValue=""
            aria-invalid={invalid("categoryId")}
            aria-describedby={describedBy("categoryId", false, invalid("categoryId"))}
          >
            <option value="">Sans catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Description de l’image"
          name="alt"
          hint="Lue par les lecteurs d’écran et utile au référencement."
          errors={errors.alt}
        >
          <Input
            id="alt"
            name="alt"
            maxLength={200}
            className="h-11"
            aria-invalid={invalid("alt")}
            aria-describedby={describedBy("alt", true, invalid("alt"))}
          />
        </Field>
      </div>

      {failure && !errors.file?.[0] && !errors.categoryId?.[0] && !errors.alt?.[0] && (
        <p role="alert" className="text-sm text-destructive">
          {failure.message}
        </p>
      )}
      {added && (
        <p role="status" className="text-sm text-gold">
          Ajouté à la galerie.
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 px-6">
        {pending ? "Téléversement…" : "Ajouter à la galerie"}
      </Button>
    </form>
  );
}
