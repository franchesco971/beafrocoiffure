import "dotenv/config";
import { db } from "@/lib/db";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 30_000);

// Étape 5 : traiter la file `notification` (e-mails, rappels J-1) avec reprise en cas d'échec.
async function tick() {
  await db.$queryRaw`SELECT 1`;
}

let timer: NodeJS.Timeout | undefined;
let stopping = false;

async function loop() {
  try {
    await tick();
  } catch (error) {
    console.error("[worker] échec du cycle", error);
  }
  if (!stopping) timer = setTimeout(loop, INTERVAL_MS);
}

async function stop(signal: string) {
  console.log(`[worker] ${signal} reçu, arrêt`);
  stopping = true;
  clearTimeout(timer);
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => void stop("SIGTERM"));
process.on("SIGINT", () => void stop("SIGINT"));

console.log(`[worker] démarré (cycle toutes les ${INTERVAL_MS} ms)`);
void loop();
