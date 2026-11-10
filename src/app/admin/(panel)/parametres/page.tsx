import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminNotificationEmail } from "@/lib/settings";
import { loadRules } from "@/modules/booking/booking.service";
import { db } from "@/lib/db";
import { changePassword, saveAdminEmail, saveBookingRules } from "./actions";
import { AdminEmailForm, BookingRulesForm, PasswordForm } from "./settings-forms";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <AdminPage title="Paramètres">
      <Suspense fallback={<AdminLoading />}>
        <Settings />
      </Suspense>
    </AdminPage>
  );
}

async function Settings() {
  const admin = await requireAdmin();
  const isAdmin = admin.role === "ADMIN";

  const [rules, adminEmail] = isAdmin ? await Promise.all([loadRules(db), getAdminNotificationEmail()]) : [null, ""];

  return (
    <div className="space-y-16">
      {rules && (
        <>
          <section aria-labelledby="regles">
            <h2 id="regles" className="display text-3xl text-bone">
              Règles de réservation
            </h2>
            <p className="mb-6 mt-2 text-sm text-bone-dim">
              S’appliquent aux nouvelles réservations en ligne ; l’administration peut les dépasser depuis le planning.
            </p>
            <BookingRulesForm
              action={saveBookingRules}
              defaults={Object.fromEntries(Object.entries(rules).map(([name, value]) => [name, String(value)]))}
            />
          </section>

          <section aria-labelledby="emails" className="border-t border-bone/10 pt-12">
            <h2 id="emails" className="display text-3xl text-bone">
              E-mails
            </h2>
            <p className="mb-6 mt-2 text-sm text-bone-dim">
              L’envoi des e-mails sera activé avec les notifications ; l’adresse peut déjà être renseignée.
            </p>
            <AdminEmailForm action={saveAdminEmail} defaults={{ adminEmail }} />
          </section>
        </>
      )}

      <section aria-labelledby="compte" className={isAdmin ? "border-t border-bone/10 pt-12" : undefined}>
        <h2 id="compte" className="display text-3xl text-bone">
          Compte administrateur
        </h2>
        <p className="mb-6 mt-2 text-sm text-bone-dim">Connecté en tant que {admin.email}.</p>
        <PasswordForm action={changePassword} />
      </section>
    </div>
  );
}
