import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Une question sur une prestation, un événement ou un accompagnement ? Écrivez-nous.",
  alternates: { canonical: "/contact" },
};

const SOCIALS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
] as const;

export default async function ContactPage() {
  const contact = await getContent("site.contact");
  const socials = SOCIALS.filter(({ key }) => contact[key]);

  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto grid max-w-[88rem] gap-16 lg:grid-cols-12">
        <header className="lg:col-span-5">
          <p className="eyebrow">Contact</p>
          <h1 className="display mt-5 text-5xl text-bone md:text-7xl">
            Parlons de votre <em>projet.</em>
          </h1>
          <p className="mt-6 max-w-[40ch] text-lg text-bone-dim">
            Une question avant de réserver ? Écrivez-nous, la réponse arrive par e-mail.
          </p>

          <dl className="mt-12 space-y-6">
            {contact.email && (
              <div>
                <dt className="eyebrow">E-mail</dt>
                <dd className="mt-2">
                  <a href={`mailto:${contact.email}`} className="text-bone transition-colors hover:text-gold">
                    {contact.email}
                  </a>
                </dd>
              </div>
            )}
            {contact.phone && (
              <div>
                <dt className="eyebrow">Téléphone</dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="text-bone transition-colors hover:text-gold"
                  >
                    {contact.phone}
                  </a>
                </dd>
              </div>
            )}
            {contact.address && (
              <div>
                <dt className="eyebrow">Lieu</dt>
                <dd className="mt-2 whitespace-pre-line text-bone">{contact.address}</dd>
              </div>
            )}
            {socials.length > 0 && (
              <div>
                <dt className="eyebrow">Réseaux</dt>
                <dd className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  {socials.map(({ key, label }) => (
                    <a
                      key={key}
                      href={contact[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bone transition-colors hover:text-gold"
                    >
                      {label}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </header>

        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
