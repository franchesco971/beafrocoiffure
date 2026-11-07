import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { NAV_LINKS } from "@/lib/site";

export function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-bone/10 bg-ink-2 pb-28 pt-20 sm:pb-12">
      <div className="mx-auto grid max-w-[88rem] gap-14 px-5 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-6">
          <p className="display max-w-[16ch] text-4xl text-bone md:text-5xl">
            Prenez soin de votre <em>couronne.</em>
          </p>
          <p className="mt-6 max-w-[44ch] text-bone-dim">
            BeAfro Coiffure — cheveux texturés, locks, MicroLocks et soins capillaires. BeAfro Beauté &amp; Bien-être —
            conseils, testing et accompagnements.
          </p>
        </div>

        <nav aria-label="Pied de page" className="lg:col-span-3 lg:col-start-8">
          <p className="eyebrow">Explorer</p>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-bone transition-colors hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-2">
          <p className="eyebrow">En ligne</p>
          <p className="mt-5 text-bone">www.beafrocoiffure.fr</p>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[88rem] px-5 lg:px-10">
        <Logo decorative className="w-full text-bone/[0.07]" />
        <p className="mt-8 border-t border-bone/10 pt-6 text-sm text-bone-dim">
          BeAfro Coiffure. Le conseil beauté et bien-être ne constitue pas une prestation médicale.
        </p>
      </div>
    </footer>
  );
}
