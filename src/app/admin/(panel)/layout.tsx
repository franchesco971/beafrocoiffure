import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/admin/actions";
import { AdminNav, AdminNavLinks } from "@/components/admin/AdminNav";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-bone/10 bg-ink-2">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 lg:px-10">
          <Link href="/admin" aria-label="Administration — accueil" className="text-bone">
            <Logo className="w-28" />
          </Link>
          <Suspense fallback={<AdminNavLinks pathname={null} />}>
            <AdminNav />
          </Suspense>
          <form action={logout}>
            <Button type="submit" variant="ghost">
              Se déconnecter
            </Button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
