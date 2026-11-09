import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { audit } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

const SESSION_MAX_AGE = 8 * 60 * 60;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const MAX_PASSWORD_LENGTH = 256;

export class InvalidLogin extends CredentialsSignin {
  code = "invalid_credentials";
}

export class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

// Échecs seulement : 5 par e-mail et 20 par adresse IP sur 15 minutes.
const failuresByEmail = createRateLimiter({ name: "login-email", limit: 5, windowMs: FIFTEEN_MINUTES });
const failuresByIp = createRateLimiter({ name: "login-ip", limit: 20, windowMs: FIFTEEN_MINUTES });

export const { auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const { email, password } = credentials;
        if (typeof email !== "string" || typeof password !== "string" || password.length > MAX_PASSWORD_LENGTH) {
          throw new InvalidLogin();
        }

        const emailKey = email.trim().toLowerCase();
        const ipKey = clientIp(request);
        if (failuresByEmail.retryAfter(emailKey) || failuresByIp.retryAfter(ipKey)) throw new TooManyAttempts();

        const admin = await db.adminUser.findUnique({ where: { email: emailKey } });
        if (!(await verifyPassword(admin?.passwordHash, password)) || !admin) {
          failuresByEmail.hit(emailKey);
          failuresByIp.hit(ipKey);
          await audit(admin?.id ?? null, "LOGIN_FAILED", "admin_user", admin?.id);
          throw new InvalidLogin();
        }

        failuresByEmail.reset(emailKey);
        await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
        await audit(admin.id, "LOGIN", "admin_user", admin.id);
        return { id: String(admin.id), email: admin.email, role: admin.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.uid)
        await audit(Number(message.token.uid), "LOGOUT", "admin_user", message.token.uid);
    },
  },
});
