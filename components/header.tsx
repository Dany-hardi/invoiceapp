// =============================================================================
// components/header.tsx
// "use client" — Top bar with dynamic breadcrumb + user dropdown.
// =============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  ChevronRight,
  LogOut,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Breadcrumb config — maps path segments to human labels
// ---------------------------------------------------------------------------

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  invoices:  "Invoices",
  customers: "Customers",
  settings:  "Settings",
  new:       "New Invoice",
  edit:      "Edit",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function Header() {
  const breadcrumbs = useBreadcrumbs();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0D0D0D] px-6">
      {/* ------------------------------------------------------------------ */}
      {/* Breadcrumb                                                            */}
      {/* ------------------------------------------------------------------ */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="h-3 w-3 text-neutral-700" strokeWidth={2} />
            )}
            {crumb.isLast ? (
              <span className="text-sm font-medium text-white tracking-tight">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors tracking-tight"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Right controls                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2">
        {/* Notifications (placeholder) */}
        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300",
            "transition-all duration-150"
          )}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "bg-gradient-to-br from-blue-500 to-blue-700",
              "text-[11px] font-bold text-white",
              "ring-2 ring-transparent hover:ring-white/20 transition-all duration-150"
            )}
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            U
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "absolute right-0 top-10 z-50 w-48",
                  "rounded-xl border border-white/[0.08] bg-[#161616]",
                  "shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden"
                )}
              >
                {/* Menu items */}
                <div className="p-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2",
                      "text-xs text-neutral-400 hover:bg-white/[0.05] hover:text-white",
                      "transition-colors duration-100"
                    )}
                  >
                    <Settings className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
                    Settings
                  </Link>

                  <div className="my-1 h-px bg-white/[0.06]" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2",
                      "text-xs text-neutral-400 hover:bg-red-500/10 hover:text-red-400",
                      "transition-colors duration-100"
                    )}
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
