"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", match: (path: string) => path === "/admin" },
  { href: "/admin/planning", label: "Planning", match: (path: string) => path.startsWith("/admin/planning") },
  { href: "/admin/clients", label: "Clients", match: (path: string) => path.startsWith("/admin/clients") },
  {
    href: "/admin/prestations",
    label: "Prestations",
    match: (path: string) => path.startsWith("/admin/prestations") || path.startsWith("/admin/categories"),
  },
  { href: "/admin/galerie", label: "Galerie", match: (path: string) => path.startsWith("/admin/galerie") },
  { href: "/admin/evenements", label: "Événements", match: (path: string) => path.startsWith("/admin/evenements") },
  { href: "/admin/avis", label: "Avis", match: (path: string) => path.startsWith("/admin/avis") },
  { href: "/admin/messages", label: "Messages", match: (path: string) => path.startsWith("/admin/messages") },
  { href: "/admin/contenus", label: "Contenus", match: (path: string) => path.startsWith("/admin/contenus") },
  {
    href: "/admin/statistiques",
    label: "Statistiques",
    match: (path: string) => path.startsWith("/admin/statistiques"),
  },
  { href: "/admin/parametres", label: "Paramètres", match: (path: string) => path.startsWith("/admin/parametres") },
];

export function AdminNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Administration" className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      {LINKS.map((link) => {
        const current = pathname !== null && link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={current ? "text-gold" : "text-bone-dim transition-colors hover:text-bone"}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

// `usePathname` lit l'URL au moment de la requête : à placer dans un <Suspense> avec `AdminNavLinks` en repli.
export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}
