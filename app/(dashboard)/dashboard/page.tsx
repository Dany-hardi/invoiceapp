// =============================================================================
// app/(dashboard)/dashboard/page.tsx
// Dashboard overview — stat cards, recent invoices stub, skeleton-ready.
// =============================================================================

import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { FileText, DollarSign, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

// ---------------------------------------------------------------------------
// Stat card component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-600">{sub}</p>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 w-20 rounded bg-white/[0.06]" />
        <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
      </div>
      <div className="h-7 w-28 rounded bg-white/[0.06]" />
      <div className="mt-2 h-3 w-16 rounded bg-white/[0.04]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats data fetcher
// ---------------------------------------------------------------------------

async function DashboardStats({ userId }: { userId: string }) {
  const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices] =
    await Promise.all([
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.findMany({
        where: { userId, status: "PAID" },
        select: { totalCents: true, currency: true },
      }),
      prisma.invoice.count({
        where: { userId, status: { in: ["SENT", "VIEWED"] } },
      }),
      prisma.invoice.count({ where: { userId, status: "OVERDUE" } }),
    ]);

  const paidTotal = paidInvoices.reduce((sum, inv) => sum + inv.totalCents, 0);
  const currency = paidInvoices[0]?.currency ?? "USD";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Total Revenue"
        value={formatCurrency(paidTotal, currency)}
        icon={DollarSign}
        accent="bg-green-500/10 text-green-400"
        sub={`${paidInvoices.length} paid invoices`}
      />
      <StatCard
        label="Total Invoices"
        value={String(totalInvoices)}
        icon={FileText}
        accent="bg-blue-500/10 text-blue-400"
        sub="All time"
      />
      <StatCard
        label="Pending"
        value={String(pendingInvoices)}
        icon={Clock}
        accent="bg-amber-500/10 text-amber-400"
        sub="Awaiting payment"
      />
      <StatCard
        label="Overdue"
        value={String(overdueInvoices)}
        icon={TrendingUp}
        accent={overdueInvoices > 0 ? "bg-red-500/10 text-red-400" : "bg-white/[0.04] text-neutral-500"}
        sub={overdueInvoices > 0 ? "Action needed" : "All clear"}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent invoices stub
// ---------------------------------------------------------------------------

async function RecentInvoices({ userId }: { userId: string }) {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { customer: { select: { name: true } } },
  });

  const statusColors: Record<string, string> = {
    DRAFT:    "bg-neutral-500/10 text-neutral-400",
    SENT:     "bg-blue-500/10 text-blue-400",
    VIEWED:   "bg-purple-500/10 text-purple-400",
    PAID:     "bg-green-500/10 text-green-400",
    OVERDUE:  "bg-red-500/10 text-red-400",
    CANCELLED:"bg-neutral-500/10 text-neutral-600",
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-[#161616]">
          <FileText className="h-5 w-5 text-neutral-600" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-neutral-400">No invoices yet</p>
        <p className="mt-1 text-xs text-neutral-700">
          Create your first invoice to get started.
        </p>
        <Link
          href="/dashboard/invoices/new"
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          Create Invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.04]">
      {invoices.map((inv) => (
        <Link
          key={inv.id}
          href={`/dashboard/invoices/${inv.id}`}
          className="flex items-center justify-between px-1 py-3.5 hover:bg-white/[0.02] rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-[#161616]">
              <FileText className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                {inv.invoiceNumber}
              </p>
              <p className="text-xs text-neutral-600">{inv.customer.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColors[inv.status] ?? ""}`}>
              {inv.status}
            </span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(inv.totalCents, inv.currency)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s a snapshot of your business.
        </p>
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
          </div>
        }
      >
        <DashboardStats userId={userId} />
      </Suspense>

      {/* Recent invoices */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Recent Invoices
          </h2>
          <Link
            href="/dashboard/invoices"
            className="text-xs text-neutral-500 hover:text-blue-400 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] px-3 py-1">
          <Suspense
            fallback={
              <div className="py-4 space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between px-1 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/[0.06]" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 rounded bg-white/[0.06]" />
                        <div className="h-3 w-16 rounded bg-white/[0.04]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
                      <div className="h-4 w-16 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <RecentInvoices userId={userId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
