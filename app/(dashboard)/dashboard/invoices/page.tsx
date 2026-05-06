// =============================================================================
// app/(dashboard)/invoices/page.tsx
// Server Component — Invoice list with status, amounts, customer, actions.
// =============================================================================

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FileText, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "Invoices" };

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
  SENT:      "bg-blue-500/10   text-blue-400   border-blue-500/20",
  VIEWED:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PAID:      "bg-green-500/10  text-green-400  border-green-500/20",
  OVERDUE:   "bg-red-500/10    text-red-400    border-red-500/20",
  CANCELLED: "bg-neutral-500/10 text-neutral-700 border-neutral-700/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function InvoiceListSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#111111] px-5 py-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-white/[0.06]" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-white/[0.06]" />
              <div className="h-3 w-20 rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
            <div className="h-3.5 w-16 rounded bg-white/[0.06]" />
            <div className="h-4 w-20 rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice list data
// ---------------------------------------------------------------------------

async function InvoiceList({ userId }: { userId: string }) {
  const invoices = await prisma.invoice.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true, company: true } } },
    take: 50,
  });

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161616]">
          <FileText className="h-6 w-6 text-neutral-700" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-neutral-400">No invoices yet</p>
        <p className="mt-1.5 text-xs text-neutral-700">
          Create your first invoice and get paid faster.
        </p>
        <Link
          href="/dashboard/invoices/new"
          className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create Invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 border-b border-white/[0.06] bg-[#111111] px-5 py-3">
        {["Invoice", "Customer", "Status", "Due Date", "Amount"].map((col, i) => (
          <p
            key={col}
            className={`text-[10px] font-semibold uppercase tracking-wider text-neutral-600 ${
              i === 0 ? "col-span-3"
              : i === 1 ? "col-span-3"
              : i === 2 ? "col-span-2"
              : i === 3 ? "col-span-2"
              : "col-span-2 text-right"
            }`}
          >
            {col}
          </p>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.04] bg-[#0E0E0E]">
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/dashboard/invoices/${inv.id}`}
            className="group grid grid-cols-12 items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            {/* Invoice number */}
            <div className="col-span-3 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                <FileText className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.5} />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {inv.invoiceNumber}
                </p>
                <p className="text-[11px] text-neutral-700">
                  {formatDate(inv.createdAt)}
                </p>
              </div>
            </div>

            {/* Customer */}
            <div className="col-span-3 overflow-hidden">
              <p className="truncate text-sm text-neutral-300">
                {inv.customer.name}
              </p>
              {inv.customer.company && (
                <p className="truncate text-[11px] text-neutral-700">
                  {inv.customer.company}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="col-span-2">
              <StatusBadge status={inv.status} />
            </div>

            {/* Due date */}
            <div className="col-span-2">
              <p className="text-xs text-neutral-500">
                {formatDate(inv.dueDate)}
              </p>
            </div>

            {/* Amount */}
            <div className="col-span-2 flex items-center justify-end gap-2">
              <p className="tabular-nums text-sm font-semibold text-white">
                {formatCurrency(inv.totalCents, inv.currency)}
              </p>
              <ArrowUpRight
                className="h-3.5 w-3.5 flex-shrink-0 text-neutral-700 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all"
                strokeWidth={2}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage and track all your invoices.
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Invoice
        </Link>
      </div>

      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList userId={session.user.id} />
      </Suspense>
    </div>
  );
}
