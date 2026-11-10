import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { deleteMessage, setMessageHandled } from "./actions";

export const metadata: Metadata = { title: "Messages" };

const LIMIT = 100;

export default function MessagesPage() {
  return (
    <AdminPage title="Messages">
      <Suspense fallback={<AdminLoading />}>
        <Messages />
      </Suspense>
    </AdminPage>
  );
}

async function Messages() {
  await requireAdmin();
  const messages = await db.contactMessage.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
    take: LIMIT,
  });

  if (messages.length === 0) return <p className="text-bone-dim">Aucun message pour le moment.</p>;

  return (
    <>
      <ul className="space-y-4">
        {messages.map((message) => (
          <li
            key={message.id}
            className={`rounded-2xl border bg-ink-2 p-5 ${message.handled ? "border-bone/10" : "border-gold/40"}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="text-bone">
                {message.name}
                {!message.handled && (
                  <span className="ml-3 rounded-full border border-gold/60 px-2 py-0.5 text-xs text-gold">
                    À traiter
                  </span>
                )}
              </p>
              <p className="text-sm text-bone-dim">{formatDateTime(message.createdAt)}</p>
            </div>
            <a
              href={`mailto:${message.email}`}
              className="mt-1 inline-block text-sm text-gold transition-colors hover:text-bone"
            >
              {message.email}
            </a>
            <p className="mt-4 max-w-[70ch] whitespace-pre-line text-bone">{message.message}</p>

            <div className="mt-5 flex flex-wrap items-start gap-4">
              <form action={setMessageHandled.bind(null, message.id, !message.handled)}>
                <Button type="submit" variant="outline" className="h-11 px-5">
                  {message.handled ? "Rouvrir" : "Marquer comme traité"}
                </Button>
              </form>
              <DeleteForm
                action={deleteMessage.bind(null, message.id)}
                label="Supprimer"
                confirmMessage={`Supprimer le message de ${message.name} ?`}
              />
            </div>
          </li>
        ))}
      </ul>
      {messages.length === LIMIT && (
        <p className="mt-4 text-sm text-bone-dim">Seuls les {LIMIT} messages les plus récents sont affichés.</p>
      )}
    </>
  );
}
