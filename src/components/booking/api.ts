export type ApiFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[] | undefined>;
};

export type ApiResult<T> = { ok: true; data: T } | ApiFailure;

/** Appel JSON vers nos routes `/api` ; ne lève jamais d'exception (réseau compris). */
export async function callApi<T>(url: string, init?: { method: "POST"; body: unknown }): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: init?.method ?? "GET",
      headers: init ? { "Content-Type": "application/json" } : undefined,
      body: init ? JSON.stringify(init.body) : undefined,
    });
    const body = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: body as T };
    return {
      ok: false,
      status: response.status,
      code: body?.error ?? "error",
      message: body?.message ?? "Une erreur est survenue. Réessayez dans un instant.",
      fields: body?.fields,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "network",
      message: "Connexion impossible. Vérifiez votre réseau et réessayez.",
    };
  }
}
