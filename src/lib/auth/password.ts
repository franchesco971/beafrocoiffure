import { hash, verify } from "@node-rs/argon2";

// Argon2id avec les paramètres par défaut de la bibliothèque (conformes aux recommandations OWASP).
export const hashPassword = (password: string) => hash(password);

let dummyHash: Promise<string> | undefined;

// Sans compte correspondant, on vérifie quand même un hash factice : le temps de réponse ne révèle pas si l'e-mail existe.
export async function verifyPassword(passwordHash: string | undefined, password: string) {
  dummyHash ??= hash("mot-de-passe-factice");
  const valid = await verify(passwordHash ?? (await dummyHash), password).catch(() => false);
  return passwordHash !== undefined && valid;
}
