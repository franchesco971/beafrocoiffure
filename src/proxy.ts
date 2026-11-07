import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Redirection optimiste ; l'autorisation réelle est vérifiée par `requireAdmin()` dans chaque page et action.
export default auth((request) => {
  if (!request.auth && request.nextUrl.pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.nextUrl));
  }
});

export const config = { matcher: ["/admin/:path*"] };
