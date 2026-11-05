import { HAIR_SERVICES } from "../src/content/services";
import { db } from "../src/lib/db";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Durées provisoires (minutes), dans l'ordre de HAIR_SERVICES : à confirmer avec la cliente.
const HAIR_DURATIONS = [240, 480, 120, 120, 60, 120, 90, 45];

const WELLNESS = [
  {
    title: "Séances de testing produits",
    service: "Séance de testing produits",
    text: "Essayez des produits adaptés à votre type de cheveux lors d'une séance dédiée.",
  },
  {
    title: "Accompagnements personnalisés",
    service: "Accompagnement personnalisé",
    text: "Conseils beauté, routines de soins, accompagnement bien-être et suivi personnalisé. Ne constitue pas une prestation médicale.",
  },
] as const;

const GALLERY_CATEGORIES = ["Locks", "MicroLocks", "Soins capillaires", "Coiffures naturelles", "Transformations avant/après"];

// `update: {}` : relancer le seed ne doit jamais écraser ce qui a été modifié depuis l'administration.
async function seedCategory(name: string, universe: "HAIR" | "WELLNESS", position: number) {
  const slug = slugify(name);
  return db.serviceCategory.upsert({ where: { slug }, update: {}, create: { name, slug, universe, position } });
}

async function seedService(categoryId: number, title: string, description: string, durationMin: number, position: number) {
  const slug = slugify(title);
  await db.service.upsert({
    where: { slug },
    update: {},
    create: { categoryId, slug, title, description, durationMin, priceMode: "QUOTE", position },
  });
}

async function main() {
  for (const [index, { title, text }] of HAIR_SERVICES.entries()) {
    const category = await seedCategory(title, "HAIR", index + 1);
    await seedService(category.id, title, text, HAIR_DURATIONS[index], index + 1);
  }

  for (const [index, { title, service, text }] of WELLNESS.entries()) {
    const category = await seedCategory(title, "WELLNESS", index + 1);
    await seedService(category.id, service, text, 60, index + 1);
  }

  for (const [index, name] of GALLERY_CATEGORIES.entries()) {
    const slug = slugify(name);
    await db.galleryCategory.upsert({ where: { slug }, update: {}, create: { name, slug, position: index + 1 } });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
