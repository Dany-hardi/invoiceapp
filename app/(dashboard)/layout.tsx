// =============================================================================
// app/(dashboard)/layout.tsx
// Authenticated shell — wraps all protected routes.
// Server Component: validates session, redirects if missing.
// =============================================================================

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar — fixed left column                                         */}
      {/* ------------------------------------------------------------------ */}
      <Sidebar user={session.user} />

      {/* ------------------------------------------------------------------ */}
      {/* Main content area                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
