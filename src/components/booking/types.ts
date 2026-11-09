export type Contact = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  consent: boolean;
  /** Champ piège : doit rester vide. */
  website: string;
};

export const EMPTY_CONTACT: Contact = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  notes: "",
  consent: false,
  website: "",
};

export type CreatedBooking = {
  status: "PENDING" | "CONFIRMED";
  startsAt: string;
  /** Lien sécurisé du client ; `null` si la demande a été ignorée (robot). */
  cancelPath: string | null;
};
