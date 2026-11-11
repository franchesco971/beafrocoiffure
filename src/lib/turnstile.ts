const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Sans clé secrète, Turnstile est désactivé : honeypot et limitation de débit restent actifs.
export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

/** Vérifie le jeton Turnstile d'un envoi de formulaire ; refuse si le service est injoignable. */
export async function verifyTurnstile(body: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  const token =
    typeof body === "object" && body !== null ? (body as { turnstileToken?: unknown }).turnstileToken : null;
  if (typeof token !== "string" || token === "" || token.length > 2048) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (ip !== "inconnue") form.set("remoteip", ip);

  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body: form, signal: AbortSignal.timeout(5_000) });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
