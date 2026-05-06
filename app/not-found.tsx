// =============================================================================
// app/not-found.tsx
// Global 404 page — shown for any unmatched route including /pay/[bad-token]
// =============================================================================

import Link from "next/link";
import { FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111111]">
          <FileSearch className="h-7 w-7 text-neutral-600" strokeWidth={1.5} />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white tracking-tight">404</h1>
        <p className="mb-1 text-sm font-medium text-neutral-400">Page not found</p>
        <p className="mb-8 text-xs text-neutral-700">
          The invoice link may be invalid or has expired.
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
