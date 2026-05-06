// =============================================================================
// app/page.tsx
// Root route — redirect authenticated users to dashboard, others to login.
// The middleware handles the actual auth check; this is a safety fallback.
// =============================================================================

import { redirect } from "next/navigation";
import { auth }     from "@/auth";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
