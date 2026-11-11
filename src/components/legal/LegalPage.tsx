import type { Metadata } from "next";
import { LegalText } from "@/components/legal/LegalText";
import { LEGAL_PAGES, type LegalKey } from "@/content/pages";
import { getContent } from "@/lib/content";

export const legalMetadata = (key: LegalKey): Metadata => ({
  title: LEGAL_PAGES[key].title,
  description: LEGAL_PAGES[key].description,
  alternates: { canonical: LEGAL_PAGES[key].path },
});

export async function LegalPage({ contentKey }: { contentKey: LegalKey }) {
  const content = await getContent(contentKey);

  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Informations légales</p>
        <h1 className="display mt-5 text-4xl text-bone md:text-6xl">{LEGAL_PAGES[contentKey].title}</h1>
        <div className="mt-12">
          <LegalText source={content.body} />
        </div>
      </div>
    </section>
  );
}
