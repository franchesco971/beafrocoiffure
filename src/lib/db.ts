import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// Instance unique en développement (le hot reload recréerait sinon une connexion à chaque modification).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Connexion paresseuse : sans DATABASE_URL (build sans base), rien n'est tenté avant la première requête.
    adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ""),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
