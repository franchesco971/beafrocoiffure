// Cible du tunnel de réservation : à remplacer par "/reservation" quand le module de réservation existera.
export const BOOKING_HREF = "/#reservation";

export const NAV_LINKS = [
  { label: "Univers", href: "/#univers" },
  { label: "Prestations", href: "/coiffure" },
  { label: "Réservation", href: "/#reservation" },
] as const;
