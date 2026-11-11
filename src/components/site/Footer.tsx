import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { getContent } from "@/lib/content";
import { FOOTER_LINKS, LEGAL_LINKS } from "@/lib/site";

const SOCIALS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
] as const;

export async function Footer() {
  const contact = await getContent("site.contact");
  const socials = SOCIALS.filter(({ key }) => contact[key]);

  return (
    <footer className="relative overflow-hidden border-t border-bone/10 bg-ink-2 pb-28 pt-20 sm:pb-12">
      <div className="mx-auto grid max-w-[88rem] gap-14 px-5 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <p className="display max-w-[16ch] text-4xl text-bone md:text-5xl">
            Prenez soin de votre <em>couronne.</em>
          </p>
          <p className="mt-6 max-w-[44ch] text-bone-dim">
            BeAfro Coiffure — cheveux texturés, locks, MicroLocks et soins capillaires. BeAfro Beauté &amp; Bien-être —
            conseils, testing et accompagnements.
          </p>
        </div>

        <nav aria-label="Pied de page" className="lg:col-span-3 lg:col-start-7">
          <p className="eyebrow">Explorer</p>
          <ul className="mt-5 space-y-3">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-bone transition-colors hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <p className="eyebrow">Contact</p>
          <ul className="mt-5 space-y-3 text-bone">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-gold">
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-gold">
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.address && <li className="whitespace-pre-line text-bone-dim">{contact.address}</li>}
            {socials.map(({ key, label }) => (
              <li key={key}>
                <a
                  href={contact[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gold"
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/contact" className="text-gold transition-colors hover:text-bone">
                Nous écrire
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[88rem] px-5 lg:px-10">
        <Logo decorative className="w-full text-bone/[0.07]" />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-t border-bone/10 pt-6 text-sm text-bone-dim">
          <p>BeAfro Coiffure. Le conseil beauté et bien-être ne constitue pas une prestation médicale.</p>
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
