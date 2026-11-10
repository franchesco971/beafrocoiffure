// Tunnel de réservation en ligne.
export const BOOKING_HREF = "/reservation";

export const NAV_LINKS = [
  { label: "Coiffure", href: "/coiffure" },
  { label: "Bien-être", href: "/beaute-bien-etre" },
  { label: "Galerie", href: "/galerie" },
  { label: "Événements", href: "/evenements" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = [
  ...NAV_LINKS,
  { label: "Avis", href: "/avis" },
  { label: "Réservation", href: BOOKING_HREF },
] as const;
