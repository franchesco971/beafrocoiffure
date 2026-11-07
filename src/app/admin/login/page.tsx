import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-md">
        <Logo className="mx-auto w-44 text-bone" />
        <div className="mt-10 rounded-[2rem] border border-gold/30 bg-ink-2 p-8 md:p-10">
          <p className="eyebrow">Espace administration</p>
          <h1 className="display mt-3 text-4xl text-bone">Connexion</h1>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
