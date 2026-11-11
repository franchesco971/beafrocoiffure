import { z } from "zod";

const NO_STORE = { "Cache-Control": "no-store" };

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

export const apiError = (status: number, error: string, message: string, extra?: Record<string, unknown>) =>
  json({ error, message, ...extra }, status);

export const captchaFailed = () =>
  apiError(400, "captcha_failed", "La vérification anti-robot a échoué. Patientez un instant puis réessayez.");

export const tooManyRequests = (retryAfterMs: number) =>
  Response.json(
    { error: "too_many_requests", message: "Trop de requêtes. Réessayez dans quelques instants." },
    { status: 429, headers: { ...NO_STORE, "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
  );

export function validationError(error: z.ZodError) {
  const fields = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const message = error.issues[0]?.message ?? "Requête invalide.";
  return apiError(400, "validation_error", message, { fields });
}

/** Corps JSON limité à `maxBytes` ; `null` si le corps est illisible ou trop volumineux. */
export async function readJson(request: Request, maxBytes = 10_000): Promise<unknown | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return null;
  try {
    const text = await request.text();
    return text.length > maxBytes ? null : JSON.parse(text);
  } catch {
    return null;
  }
}
