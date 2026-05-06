// =============================================================================
// middleware.ts
// =============================================================================

import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; // 👈 Import the Edge config
import { NextResponse } from "next/server";

// Initialize NextAuth with the Edge-compatible config
const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  "/pay",
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAuthenticated = !!session?.user;
  const path = nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  // Redirect authenticated users away from login
  if (isAuthenticated && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
