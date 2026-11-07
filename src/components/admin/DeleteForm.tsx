"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/admin/forms";

// Suppression avec confirmation ; `action` est une action serveur déjà liée à l'identifiant.
export function DeleteForm({
  action,
  label,
  confirmMessage,
}: {
  action: (previous: FormState) => Promise<FormState>;
  label: string;
  confirmMessage: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="space-y-3"
    >
      <Button type="submit" variant="destructive" disabled={pending} className="h-11 px-5">
        {pending ? "Suppression…" : label}
      </Button>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
