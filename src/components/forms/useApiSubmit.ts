"use client";

import { useState } from "react";
import { callApi, type ApiFailure } from "@/components/booking/api";

/** Envoi JSON d'un formulaire public vers une route `/api` : état d'envoi, erreur éventuelle et réponse. */
export function useApiSubmit<T = unknown>(url: string) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [data, setData] = useState<T | null>(null);

  async function submit(body: unknown) {
    setPending(true);
    setFailure(null);
    const result = await callApi<T>(url, { method: "POST", body });
    setPending(false);
    if (result.ok) setData(result.data);
    else setFailure(result);
    return result.ok;
  }

  return { submit, pending, failure, data };
}

/** Message d'erreur général : seulement si aucun des champs affichés n'est concerné. */
export const generalError = (failure: ApiFailure | null, fields: readonly string[]) =>
  failure && !fields.some((name) => failure.fields?.[name]?.[0]) ? failure.message : null;
