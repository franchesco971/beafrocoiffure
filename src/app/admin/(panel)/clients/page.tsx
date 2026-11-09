import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Clients" };

const PAGE_SIZE = 50;
const MAX_WORDS = 5;

export default function ClientsPage(props: PageProps<"/admin/clients">) {
  return (
    <AdminPage title="Clients">
      <Suspense fallback={<AdminLoading />}>
        <ClientList searchParams={props.searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function ClientList({ searchParams }: Pick<PageProps<"/admin/clients">, "searchParams">) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);

  // Chaque mot doit se retrouver dans le prénom, le nom, le téléphone ou l'e-mail.
  const words = query.split(/\s+/).filter(Boolean).slice(0, MAX_WORDS);
  const clients = await db.client.findMany({
    where: {
      AND: words.map((word) => ({
        OR: [
          { firstName: { contains: word, mode: "insensitive" as const } },
          { lastName: { contains: word, mode: "insensitive" as const } },
          { phone: { contains: word } },
          { email: { contains: word, mode: "insensitive" as const } },
        ],
      })),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      anonymizedAt: true,
      _count: { select: { bookings: true } },
    },
  });
  const shown = clients.slice(0, PAGE_SIZE);

  return (
    <>
      <form role="search" className="flex flex-wrap gap-3">
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Nom, téléphone ou e-mail"
          aria-label="Rechercher un client"
          maxLength={100}
          className="h-11 max-w-sm"
        />
        <Button type="submit" className="h-11 px-5">
          Rechercher
        </Button>
        {query && (
          <Link href="/admin/clients" className="self-center text-sm text-bone-dim transition-colors hover:text-bone">
            Effacer
          </Link>
        )}
      </form>

      {shown.length === 0 ? (
        <p className="mt-8 text-bone-dim">
          {query ? "Aucun client ne correspond à cette recherche." : "Aucun client pour le moment."}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-bone/10 rounded-2xl border border-bone/10 bg-ink-2">
          {shown.map((client) => (
            <li key={client.id}>
              <Link
                href={`/admin/clients/${client.id}`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-ink-3"
              >
                <span>
                  <span className="block text-bone">
                    {client.firstName} {client.lastName}
                    {client.anonymizedAt && (
                      <span className="ml-3 rounded-full border border-bone/20 px-2 py-0.5 text-xs text-bone-dim">
                        Anonymisée
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-bone-dim">
                    {[client.phone, client.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="text-sm text-bone-dim">{client._count.bookings} rendez-vous</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {clients.length > PAGE_SIZE && (
        <p className="mt-4 text-sm text-bone-dim">
          Seuls les {PAGE_SIZE} premiers résultats sont affichés : affinez la recherche.
        </p>
      )}
    </>
  );
}
