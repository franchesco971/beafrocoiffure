import { Field, describedBy } from "@/components/admin/Field";
import { Arrow } from "@/components/ui/Arrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiFailure } from "./api";
import { PRIMARY_BUTTON } from "./styles";
import type { Contact } from "./types";

// Champs affichés dans le formulaire : une erreur sur un autre champ doit apparaître en message général.
const FIELDS = ["firstName", "lastName", "phone", "email", "notes", "consent"];

export function ContactStep({
  contact,
  onChange,
  onSubmit,
  pending,
  failure,
  requiresValidation,
}: {
  contact: Contact;
  onChange: (patch: Partial<Contact>) => void;
  onSubmit: () => void;
  pending: boolean;
  failure: ApiFailure | null;
  requiresValidation: boolean;
}) {
  const errors = failure?.fields ?? {};
  const invalid = (name: string) => Boolean(errors[name]?.[0]);
  const showGeneral = failure !== null && !FIELDS.some(invalid);
  const props = (name: keyof Contact & string) => ({
    id: name,
    name,
    "aria-invalid": invalid(name),
    "aria-describedby": describedBy(name, false, invalid(name)),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-7"
    >
      <p className="max-w-[52ch] text-bone-dim">
        Aucun compte à créer : ces informations servent uniquement à gérer votre rendez-vous.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Prénom" name="firstName" errors={errors.firstName}>
          <Input
            {...props("firstName")}
            value={contact.firstName}
            onChange={(event) => onChange({ firstName: event.target.value })}
            required
            maxLength={80}
            autoComplete="given-name"
            className="h-12"
          />
        </Field>
        <Field label="Nom" name="lastName" errors={errors.lastName}>
          <Input
            {...props("lastName")}
            value={contact.lastName}
            onChange={(event) => onChange({ lastName: event.target.value })}
            required
            maxLength={80}
            autoComplete="family-name"
            className="h-12"
          />
        </Field>
        <Field label="Téléphone" name="phone" errors={errors.phone}>
          <Input
            {...props("phone")}
            type="tel"
            inputMode="tel"
            value={contact.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            required
            maxLength={20}
            autoComplete="tel"
            className="h-12"
          />
        </Field>
        <Field label="E-mail" name="email" errors={errors.email}>
          <Input
            {...props("email")}
            type="email"
            value={contact.email}
            onChange={(event) => onChange({ email: event.target.value })}
            required
            maxLength={254}
            autoComplete="email"
            className="h-12"
          />
        </Field>
      </div>

      <Field
        label="Précisions (facultatif)"
        name="notes"
        hint="Type de cheveux, longueur, souhaits particuliers…"
        errors={errors.notes}
      >
        <Textarea
          {...props("notes")}
          aria-describedby={describedBy("notes", true, invalid("notes"))}
          value={contact.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          maxLength={500}
          rows={3}
        />
      </Field>

      {/* Champ piège : invisible et hors tabulation, un robot le remplit. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ne pas remplir
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={contact.website}
            onChange={(event) => onChange({ website: event.target.value })}
          />
        </label>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-bone-dim">
          <input
            type="checkbox"
            name="consent"
            checked={contact.consent}
            onChange={(event) => onChange({ consent: event.target.checked })}
            required
            aria-invalid={invalid("consent")}
            aria-describedby={describedBy("consent", false, invalid("consent"))}
            className="mt-1 size-5 shrink-0 accent-gold"
          />
          <span>
            J’accepte que mes données soient enregistrées pour gérer ma réservation et me contacter à ce sujet.
          </span>
        </label>
        {errors.consent?.[0] && (
          <p id="consent-error" role="alert" className="mt-2 text-sm text-destructive">
            {errors.consent[0]}
          </p>
        )}
      </div>

      {requiresValidation && (
        <p className="border-l-2 border-gold pl-5 text-sm text-bone-dim">
          Une des prestations choisies est confirmée par la coiffeuse : votre demande sera enregistrée, puis validée.
        </p>
      )}

      {showGeneral && (
        <p role="alert" className="text-sm text-destructive">
          {failure.message}
        </p>
      )}

      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? "Envoi…" : requiresValidation ? "Envoyer ma demande" : "Confirmer mon rendez-vous"}
        <Arrow className="size-4 transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
      </button>
    </form>
  );
}
