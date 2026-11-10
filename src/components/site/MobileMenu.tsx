"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/site";

// Navigation des écrans étroits (le menu horizontal du `Header` prend le relais dès `lg`).
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-full border border-bone/20 text-bone transition-colors hover:border-gold hover:text-gold"
      >
        <span aria-hidden="true" className="relative block h-3 w-5">
          <span
            className={`absolute left-0 h-px w-full bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 h-px w-full bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`}
          />
        </span>
      </button>

      {open && (
        <nav
          id="menu-mobile"
          aria-label="Navigation principale"
          className="absolute inset-x-0 top-full border-b border-bone/10 bg-ink px-5 pb-8 pt-4"
        >
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="border-b border-bone/10 last:border-0">
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="display block py-4 text-3xl text-bone transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
