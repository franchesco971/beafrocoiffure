import "dotenv/config";
import { lookup } from "node:dns/promises";
import { createConnection } from "node:net";
import mariadb from "mariadb";

// Diagnostic pas à pas de la connexion MySQL : `npm run db:check`.
// Chaque étape s'arrête à la première erreur avec l'indice correspondant.

const ok = (msg: string) => console.log(`  OK  ${msg}`);
const fail = (msg: string, hint?: string): never => {
  console.error(`  KO  ${msg}`);
  if (hint) console.error(`      -> ${hint}`);
  process.exit(1);
};
const reason = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function main() {
  console.log("1. DATABASE_URL");
  const raw = process.env.DATABASE_URL;
  if (!raw) fail("DATABASE_URL est absente", "Créer .env (cp env.txt .env) ou la passer en préfixe de la commande.");
  let url: URL;
  try {
    url = new URL(raw!);
  } catch {
    return fail("DATABASE_URL n'est pas une URL valide", "Encoder le mot de passe (@ -> %40, / -> %2F, # -> %23, : -> %3A).");
  }
  const host = url.hostname;
  const port = Number(url.port || 3306);
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.slice(1);
  ok(`${url.protocol}//${user}:***@${host}:${port}/${database} (mot de passe : ${password.length} caractères)`);
  if (!["mysql:", "mariadb:"].includes(url.protocol)) fail("Protocole inattendu", "Utiliser mysql://");

  console.log("2. Résolution DNS");
  try {
    const { address } = await lookup(host);
    ok(`${host} -> ${address}`);
  } catch (e) {
    fail(
      `${host} introuvable (${reason(e)})`,
      host === "db"
        ? "L'hôte `db` n'existe que dans Docker Compose. Hors conteneur, utiliser localhost:3307."
        : "Vérifier l'hôte (nom exact fourni par l'hébergeur).",
    );
  }

  console.log("3. Connexion TCP");
  await new Promise<void>((resolve) => {
    const socket = createConnection({ host, port, timeout: 5000 });
    socket.once("connect", () => {
      ok(`${host}:${port} accepte les connexions`);
      socket.destroy();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      fail("Délai dépassé", "Pare-feu ou « MySQL distant » non autorisé pour votre IP (Hostinger : hPanel > Bases de données > MySQL distant).");
    });
    socket.once("error", (e) =>
      fail(reason(e), "Conteneur arrêté ? `docker compose up -d db`, puis vérifier le port (3307 côté hôte)."),
    );
  });

  console.log("4. Authentification MySQL (driver mariadb, une seule connexion)");
  try {
    const conn = await mariadb.createConnection({ host, port, user, password, database, connectTimeout: 5000 });
    const [row] = await conn.query("SELECT VERSION() AS version, DATABASE() AS db");
    ok(`version ${row.version}, base ${row.db}`);
    const tables = await conn.query("SHOW TABLES");
    ok(`${tables.length} table(s)`);
    if (tables.length === 0) console.warn("      ! Base vide : lancer `npx prisma migrate deploy` puis `npx prisma db seed`.");
    await conn.end();
  } catch (e) {
    fail(
      reason(e),
      "Accès refusé : mauvais identifiants, ou l'utilisateur n'a pas le droit de se connecter depuis cette IP (Hostinger : autoriser l'IP).",
    );
  }

  console.log("5. Requête Prisma (même chemin que l'application)");
  const { db } = await import("../src/lib/db");
  try {
    const n = await db.service.count();
    ok(`service.count() = ${n}`);
  } catch (e) {
    fail(reason(e).split("\n").slice(-3).join(" "), "Client Prisma non généré ? `npx prisma generate` ; tables absentes ? `npx prisma migrate deploy`.");
  } finally {
    await db.$disconnect();
  }

  console.log("\nTout fonctionne.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
