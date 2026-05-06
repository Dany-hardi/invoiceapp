// =============================================================================
// app/login/page.tsx
// Passwordless login — hyper-minimalist dark UI.
// States: idle → loading → success (check email) | error
// =============================================================================

import { Suspense } from "react";
import { LoginForm } from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — InvoiceApp",
  description: "Sign in to your InvoiceApp workspace via magic link.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      {/* Ambient glow — purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
