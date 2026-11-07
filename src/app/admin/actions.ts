"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string; email?: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", { email, password: String(formData.get("password") ?? ""), redirectTo: "/admin" });
  } catch (error) {
    // En cas de succès, `signIn` redirige en levant une exception qui doit remonter à Next.js.
    if (!(error instanceof AuthError)) throw error;
    const tooMany = (error as { code?: string }).code === "too_many_attempts";
    return {
      email,
      error: tooMany
        ? "Trop de tentatives. Réessayez dans quelques minutes."
        : "Adresse e-mail ou mot de passe incorrect.",
    };
  }
  return { email };
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}
