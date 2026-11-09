import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Optionnelle : `prisma generate` (build Vercel) n'a pas besoin de base ; migrate échoue sans elle.
    url: process.env.DATABASE_URL,
  },
});
