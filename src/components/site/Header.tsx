import { Logo } from "@/components/brand/Logo";
import { BOOKING_HREF, NAV_LINKS } from "@/lib/site";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-bone/10 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-6 px-5 lg:px-10">
        <a href="#top" aria-label="BeAfro Coiffure — accueil" className="text-bone transition-colors hover:text-gold">
          <Logo className="w-28 sm:w-32" />
        </a>

        <nav aria-label="Navigation principale" className="hidden items-center gap-9 sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-sm uppercase tracking-[0.2em] text-bone-dim transition-colors hover:text-bone"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-out-expo group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <a
          href={BOOKING_HREF}
          className="rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
        >
          <span className="sm:hidden">Réserver</span>
          <span className="hidden sm:inline">Prendre rendez-vous</span>
        </a>
      </div>
    </header>
  );
}
