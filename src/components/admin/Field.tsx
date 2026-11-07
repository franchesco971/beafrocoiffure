import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

// Le contrôle enfant doit porter `id={name}` ; `describedBy` relie l'aide et l'erreur à ce champ.
export const describedBy = (name: string, hasHint: boolean, hasError: boolean) =>
  [hasHint && `${name}-hint`, hasError && `${name}-error`].filter(Boolean).join(" ") || undefined;

export function Field({
  label,
  name,
  hint,
  errors,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && (
        <p id={`${name}-hint`} className="text-xs text-bone-dim">
          {hint}
        </p>
      )}
      {errors?.[0] && (
        <p id={`${name}-error`} role="alert" className="text-sm text-destructive">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
