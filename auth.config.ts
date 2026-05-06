// =============================================================================
// auth.config.ts
// Edge-compatible Auth.js configuration for Middleware
// =============================================================================

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/login?state=check-email",
    error: "/login?state=error",
  },
  providers: [], // Keep this empty here!
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
