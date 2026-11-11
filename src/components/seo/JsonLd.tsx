// Données structurées Schema.org ; `<` est échappé pour qu'aucun texte saisi ne puisse refermer la balise.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
