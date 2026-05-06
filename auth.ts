// =============================================================================
// auth.ts  (root)
// Main Auth.js initialization for Node.js API routes
// =============================================================================

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { magicLinkEmail } from "@/lib/emails/magic-link";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", 
    maxAge: 30 * 24 * 60 * 60, 
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM!,
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const { Resend: ResendClient } = await import("resend");
        const client = new ResendClient(provider.apiKey as string);

        const { error } = await client.emails.send({
          from: provider.from as string,
          to: email,
          subject: "Your magic link — sign in to InvoiceApp",
          html: magicLinkEmail({ url, email }),
        });

        if (error) {
          throw new Error(
            `[Auth] Failed to send magic link to ${email}: ${JSON.stringify(error)}`
          );
        }
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.freelancerSettings.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            businessName: "",
            businessEmail: user.email ?? "",
          },
        });
      }
    },
  },
});
