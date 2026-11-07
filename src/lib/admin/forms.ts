import { z } from "zod";

export type FormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  /** Valeurs soumises, pour réafficher le formulaire après une erreur. */
  values?: Record<string, string>;
};

export const readText = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export const readFlag = (formData: FormData, key: string) => formData.get(key) === "on";

export const flagValue = (flag: boolean) => (flag ? "on" : "");

export const fieldErrors = (error: z.ZodError) => z.flattenError(error).fieldErrors as Record<string, string[]>;

// Montant saisi en euros ("45" ou "45,50"), vide autorisé.
export const optionalEuros = z
  .string()
  .trim()
  .regex(/^(\d{1,6}([.,]\d{1,2})?)?$/, "Montant invalide (exemple : 45 ou 45,50).");

export const eurosToCents = (value: string) =>
  value === "" ? null : Math.round(Number(value.replace(",", ".")) * 100);

export const centsToEuros = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2).replace(".", ",");

export const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

export const isForeignKeyViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2003";
