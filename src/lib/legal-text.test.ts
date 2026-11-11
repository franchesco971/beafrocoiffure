import { describe, expect, it } from "vitest";
import { isSafeHref, parseLegalText } from "./legal-text";

describe("parseLegalText", () => {
  it("découpe titres, paragraphes et listes", () => {
    const blocks = parseLegalText("## Titre\nPremière ligne\nSeconde ligne\n\n- un\n- deux\nSuite\n\nFin");
    expect(blocks).toEqual([
      { type: "heading", text: "Titre" },
      { type: "paragraph", inline: [{ text: "Première ligne\nSeconde ligne" }] },
      { type: "list", items: [[{ text: "un" }], [{ text: "deux" }]] },
      { type: "paragraph", inline: [{ text: "Suite" }] },
      { type: "paragraph", inline: [{ text: "Fin" }] },
    ]);
  });

  it("normalise les retours à la ligne Windows", () => {
    expect(parseLegalText("## A\r\n\r\nB")).toEqual([
      { type: "heading", text: "A" },
      { type: "paragraph", inline: [{ text: "B" }] },
    ]);
  });

  it("transforme les liens sûrs et neutralise les autres", () => {
    const [block] = parseLegalText(
      "Voir [contact](/contact), [CNIL](https://www.cnil.fr) et [piège](javascript:alert(1)).",
    );
    expect(block).toEqual({
      type: "paragraph",
      inline: [
        { text: "Voir " },
        { text: "contact", href: "/contact" },
        { text: ", " },
        { text: "CNIL", href: "https://www.cnil.fr" },
        { text: " et " },
        { text: "piège" },
        { text: ")." },
      ],
    });
  });

  it("ne rend jamais de HTML : les balises restent du texte", () => {
    expect(parseLegalText("<script>alert(1)</script>")).toEqual([
      { type: "paragraph", inline: [{ text: "<script>alert(1)</script>" }] },
    ]);
  });
});

describe("isSafeHref", () => {
  it.each(["/contact", "https://example.com", "mailto:a@b.fr", "tel:+33612345678"])("accepte %s", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each(["//evil.com", "http://example.com", "javascript:alert(1)", "data:text/html,x", "contact"])(
    "refuse %s",
    (href) => {
      expect(isSafeHref(href)).toBe(false);
    },
  );
});
