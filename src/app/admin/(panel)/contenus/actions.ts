"use server";

import { updateTag } from "next/cache";
import { WELLNESS_OFFER_SLOTS, contactContentSchema, wellnessContentSchema } from "@/content/pages";
import { fieldErrors, readText, type FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guard";
import { CONTENT_TAG, saveContent } from "@/lib/content";

const CONTACT_FIELDS = ["email", "phone", "address", "instagram", "facebook", "tiktok"] as const;

export async function saveContactContent(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values = Object.fromEntries(CONTACT_FIELDS.map((key) => [key, readText(formData, key)]));
  const parsed = contactContentSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  await saveContent("site.contact", parsed.data);
  await audit(admin.id, "CONTENT_UPDATE", "page_content", "site.contact");
  updateTag(CONTENT_TAG);
  return { saved: true, values };
}

export async function saveWellnessContent(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const values: Record<string, string> = { intro: readText(formData, "intro") };
  const errors: Record<string, string[]> = {};
  const offers: { title: string; text: string }[] = [];
  // Position de saisie de chaque offre conservée : les lignes vides sont ignorées et décalent les indices.
  const slotOf: number[] = [];

  for (let slot = 0; slot < WELLNESS_OFFER_SLOTS; slot++) {
    const title = readText(formData, `offerTitle${slot}`);
    const text = readText(formData, `offerText${slot}`);
    values[`offerTitle${slot}`] = title;
    values[`offerText${slot}`] = text;

    if (title.trim() === "") {
      if (text.trim() !== "") errors[`offerTitle${slot}`] = ["Indiquez un titre."];
      continue;
    }
    offers.push({ title, text });
    slotOf.push(slot);
  }

  const parsed = wellnessContentSchema.safeParse({ intro: values.intro, offers });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [field, index, key] = issue.path;
      const name =
        field === "offers" && typeof index === "number"
          ? `${key === "text" ? "offerText" : "offerTitle"}${slotOf[index]}`
          : String(field);
      errors[name] = [...(errors[name] ?? []), issue.message];
    }
  }
  if (!parsed.success || Object.keys(errors).length > 0) return { errors, values };

  await saveContent("page.wellness", parsed.data);
  await audit(admin.id, "CONTENT_UPDATE", "page_content", "page.wellness");
  updateTag(CONTENT_TAG);
  return { saved: true, values };
}
