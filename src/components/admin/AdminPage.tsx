import Link from "next/link";
import type { ReactNode } from "react";

// Conteneur commun des pages d'administration ; `back` affiche un lien de retour.
export function AdminPage({
  title,
  back,
  actions,
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 lg:px-10">
      {back && (
        <Link
          href={back.href}
          className="text-xs uppercase tracking-[0.18em] text-bone-dim transition-colors hover:text-gold"
        >
          ← {back.label}
        </Link>
      )}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-4xl text-bone md:text-5xl">{title}</h1>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      <div className="mt-10">{children}</div>
    </main>
  );
}

export function AdminLoading() {
  return <p className="text-bone-dim">Chargement…</p>;
}
