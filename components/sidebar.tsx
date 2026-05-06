// =============================================================================
// components/sidebar.tsx
// "use client" — Collapsible sidebar with Framer Motion.
// Nav items, active state detection, user avatar, collapse toggle.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",  href: "/dashboard",          icon: LayoutDashboard },
  { label: "Invoices",   href: "/dashboard/invoices",  icon: FileText },
  { label: "Customers",  href: "/dashboard/customers", icon: Users },
  { label: "Settings",   href: "/dashboard/settings",  icon: Settings },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col border-r border-white/[0.06] bg-[#0D0D0D] overflow-hidden flex-shrink-0"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Logo                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex h-14 items-center border-b border-white/[0.06] px-4 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-500">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-semibold text-white tracking-tight whitespace-nowrap overflow-hidden"
              >
                InvoiceApp
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* New Invoice CTA                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-3 pt-4 pb-2 flex-shrink-0">
        <Link
          href="/dashboard/invoices/new"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2.5",
            "bg-blue-600 hover:bg-blue-500 transition-colors duration-150",
            "text-white text-xs font-semibold tracking-tight",
            collapsed && "justify-center px-2"
          )}
        >
          <Plus className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                New Invoice
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Nav                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5",
                "text-xs font-medium transition-all duration-150",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-white/[0.06]"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}

              <Icon
                className={cn(
                  "relative h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-blue-400" : "text-neutral-600 group-hover:text-neutral-400"
                )}
                strokeWidth={isActive ? 2 : 1.75}
              />

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="relative whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Badge */}
              {item.badge && !collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500/20 px-1 text-[10px] font-semibold text-blue-400"
                >
                  {item.badge}
                </motion.span>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:flex">
                  <div className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-white shadow-lg whitespace-nowrap border border-white/10">
                    {item.label}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* User avatar + email                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-shrink-0 border-t border-white/[0.06] p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2",
            "hover:bg-white/[0.04] transition-colors cursor-default",
            collapsed && "justify-center"
          )}
        >
          {/* Avatar */}
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white">
            {initials}
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="flex-1 overflow-hidden"
              >
                <p className="truncate text-xs font-medium text-neutral-200">
                  {user.name ?? "Freelancer"}
                </p>
                <p className="truncate text-[10px] text-neutral-600">
                  {user.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Collapse toggle                                                      */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute -right-3 top-[54px] z-10",
          "flex h-6 w-6 items-center justify-center rounded-full",
          "border border-white/10 bg-[#1A1A1A] text-neutral-500",
          "hover:border-white/20 hover:text-neutral-300 transition-all duration-150",
          "shadow-lg"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" strokeWidth={2} />
        ) : (
          <ChevronLeft className="h-3 w-3" strokeWidth={2} />
        )}
      </button>
    </motion.aside>
  );
}
