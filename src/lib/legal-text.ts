// Mini-format des pages légales : `## Titre`, `- liste`, `[texte](lien)`, paragraphes séparés par une ligne vide.
// Le texte est converti en blocs puis rendu par React : aucun HTML saisi n'est jamais injecté.

export type Inline = { text: string; href?: string };

export type LegalBlock =
  { type: "heading"; text: string } | { type: "paragraph"; inline: Inline[] } | { type: "list"; items: Inline[][] };

const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

// Liens internes, https, e-mail et téléphone seulement (pas de `javascript:` ni de lien relatif au protocole).
export const isSafeHref = (href: string) => /^(\/(?!\/)|https:\/\/|mailto:|tel:)/.test(href);

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push(isSafeHref(match[2]) ? { text: match[1], href: match[2] } : { text: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function parseLegalText(source: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];
  let list: Inline[][] | null = null;

  const flush = () => {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", inline: parseInline(paragraph.join("\n")) });
    if (list) blocks.push({ type: "list", items: list });
    paragraph = [];
    list = null;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line === "") flush();
    else if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      if (paragraph.length > 0) flush();
      (list ??= []).push(parseInline(line.slice(2).trim()));
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
