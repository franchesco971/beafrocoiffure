import type { ReactNode } from "react";

// Champ piège : invisible et hors tabulation, un robot le remplit (lu avec `FormData`, nom `website`).
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Ne pas remplir
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function ConsentField({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-bone-dim">
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "consent-error" : undefined}
          className="mt-1 size-5 shrink-0 accent-gold"
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id="consent-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
