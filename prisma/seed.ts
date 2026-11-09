import { HAIR_SERVICES } from "../src/content/services";
import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import { slugify } from "../src/lib/slug";
import { DEFAULT_RULES, RULE_KEYS } from "../src/modules/booking/rules";

// Durées provisoires (minutes), dans l'ordre de HAIR_SERVICES : à confirmer avec la cliente.
const HAIR_DURATIONS = [240, 480, 120, 120, 60, 120, 90, 45];

// Horaires provisoires (mardi à samedi, 9 h – 18 h) : à confirmer avec la cliente. 1 = lundi … 7 = dimanche.
const WORKING_DAYS = [2, 3, 4, 5, 6];
const OPENING = { start: "1970-01-01T09:00:00Z", end: "1970-01-01T18:00:00Z" };

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

const GALLERY_CATEGORIES = [
  "Locks",
  "MicroLocks",
  "Soins capillaires",
  "Coiffures naturelles",
  "Transformations avant/après",
];

// `update: {}` : relancer le seed ne doit jamais écraser ce qui a été modifié depuis l'administration.
async function seedCategory(name: string, universe: "HAIR" | "WELLNESS", position: number) {
  const slug = slugify(name);
  return db.serviceCategory.upsert({ where: { slug }, update: {}, create: { name, slug, universe, position } });
}

async function seedService(
  categoryId: number,
  title: string,
  description: string,
  durationMin: number,
  position: number,
) {
  const slug = slugify(title);
  await db.service.upsert({
    where: { slug },
    update: {},
    create: { categoryId, slug, title, description, durationMin, priceMode: "QUOTE", position },
  });
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 12) throw new Error("ADMIN_PASSWORD doit contenir au moins 12 caractères.");

  const passwordHash = await hashPassword(password);
  await db.adminUser.upsert({ where: { email }, update: {}, create: { email, passwordHash, role: "ADMIN" } });
}

async function seedBookingRules() {
  for (const [name, key] of Object.entries(RULE_KEYS)) {
    const value = DEFAULT_RULES[name as keyof typeof DEFAULT_RULES];
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
}

// Seulement si aucun horaire n'existe : l'administration reste maître des plages une fois saisies.
async function seedWorkingHours() {
  if ((await db.workingHours.count()) > 0) return;
  await db.workingHours.createMany({
    data: WORKING_DAYS.map((weekday) => ({
      weekday,
      startTime: new Date(OPENING.start),
      endTime: new Date(OPENING.end),
    })),
  });
}

async function main() {
  await seedAdmin();
  await seedBookingRules();
  await seedWorkingHours();

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
