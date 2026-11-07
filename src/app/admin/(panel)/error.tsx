"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PanelError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 lg:px-10">
      <h1 className="display text-4xl text-bone md:text-5xl">Action impossible</h1>
      <p className="mt-6 max-w-[56ch] text-bone-dim">
        Une erreur est survenue ou votre rôle ne permet pas d&apos;accéder à cette page.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={reset} className="h-11 px-6">
          Réessayer
        </Button>
        <Link href="/admin" className="text-sm text-bone-dim transition-colors hover:text-bone">
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
