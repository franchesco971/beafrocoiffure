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
];

export function AdminNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Administration" className="flex items-center gap-6 text-sm">
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
