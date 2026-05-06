// =============================================================================
// app/(dashboard)/customers/page.tsx
// Server Component — Customer list with invoice count and quick actions.
// =============================================================================

import { Suspense }      from "react";
import { redirect }      from "next/navigation";
import Link              from "next/link";
import type { Metadata } from "next";
import { auth }          from "@/auth";
import { prisma }        from "@/lib/prisma";
import { formatDate }    from "@/lib/utils";
import { Users, Plus, ArrowUpRight, Mail, Building2 } from "lucide-react";

export const metadata: Metadata = { title: "Customers" };

function CustomersSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#111111] px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-white/[0.06]" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-white/[0.06]" />
              <div className="h-3 w-24 rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="h-3 w-20 rounded bg-white/[0.05]" />
            <div className="h-3 w-16 rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function CustomerList({ userId }: { userId: string }) {
  const customers = await prisma.customer.findMany({
    where:   { userId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { invoices: true } },
      invoices: {
        orderBy: { createdAt: "desc" },
        take:    1,
        select:  { createdAt: true, status: true },
      },
    },
  });

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161616]">
          <Users className="h-6 w-6 text-neutral-700" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-neutral-400">No customers yet</p>
        <p className="mt-1.5 text-xs text-neutral-700">
          Customers are created automatically when you add them to an invoice.
        </p>
        <Link
          href="/dashboard/invoices/new"
          className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create First Invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 border-b border-white/[0.06] bg-[#111111] px-5 py-3">
        {[
          { label: "Customer",   cls: "col-span-4" },
          { label: "Company",    cls: "col-span-3" },
          { label: "Invoices",   cls: "col-span-2 text-center" },
          { label: "Last Invoice", cls: "col-span-3 text-right" },
        ].map(({ label, cls }) => (
          <p key={label} className={`text-[10px] font-semibold uppercase tracking-wider text-neutral-600 ${cls}`}>
            {label}
          </p>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.04] bg-[#0E0E0E]">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/customers/${c.id}`}
            className="group grid grid-cols-12 items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            {/* Name + email */}
            <div className="col-span-4 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {c.name}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mt-0.5">
                  <Mail className="h-2.5 w-2.5 flex-shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{c.email}</span>
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="col-span-3">
              {c.company ? (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Building2 className="h-3 w-3 flex-shrink-0 text-neutral-700" strokeWidth={1.75} />
                  <span className="truncate">{c.company}</span>
                </div>
              ) : (
                <span className="text-xs text-neutral-800">—</span>
              )}
            </div>

            {/* Invoice count */}
            <div className="col-span-2 text-center">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/[0.06] px-2 text-xs font-medium text-neutral-400">
                {c._count.invoices}
              </span>
            </div>

            {/* Last invoice date */}
            <div className="col-span-3 flex items-center justify-end gap-2">
              <span className="text-xs text-neutral-600">
                {c.invoices[0] ? formatDate(c.invoices[0].createdAt) : "—"}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-neutral-700 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all" strokeWidth={2} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            All clients you've issued invoices to.
          </p>
        </div>
      </div>
      <Suspense fallback={<CustomersSkeleton />}>
        <CustomerList userId={session.user.id} />
      </Suspense>
    </div>
  );
}
