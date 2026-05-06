// =============================================================================
// app/(dashboard)/customers/[id]/page.tsx
// Server Component — Customer detail with invoice history.
// =============================================================================

import { notFound, redirect } from "next/navigation";
import Link                   from "next/link";
import type { Metadata }      from "next";
import { auth }               from "@/auth";
import { prisma }             from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft, Mail, MapPin, Building2,
  FileText, Plus, ArrowUpRight,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where:  { id },
    select: { name: true },
  });
  return { title: customer?.name ?? "Customer" };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
  SENT:      "bg-blue-500/10   text-blue-400   border-blue-500/20",
  VIEWED:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PAID:      "bg-green-500/10  text-green-400  border-green-500/20",
  OVERDUE:   "bg-red-500/10    text-red-400    border-red-500/20",
  CANCELLED: "bg-neutral-500/10 text-neutral-700 border-neutral-700/20",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where:   { id, userId: session.user.id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const totalPaid = customer.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.totalCents, 0);

  const currency = customer.invoices[0]?.currency ?? "USD";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-neutral-600 hover:border-white/[0.12] hover:text-neutral-300 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {customer.name}
          </h1>
          {customer.company && (
            <p className="mt-0.5 text-sm text-neutral-500">{customer.company}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* LEFT — customer info */}
        <div className="col-span-1 space-y-4">
          {/* Contact card */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-400">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-sm font-bold text-white mb-3">{customer.name}</h2>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                <Mail className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0" strokeWidth={1.75} />
                <a href={`mailto:${customer.email}`} className="hover:text-blue-400 transition-colors truncate">
                  {customer.email}
                </a>
              </div>
              {customer.company && (
                <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                  <Building2 className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0" strokeWidth={1.75} />
                  <span>{customer.company}</span>
                </div>
              )}
              {(customer.city || customer.country) && (
                <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0" strokeWidth={1.75} />
                  <span>{[customer.city, customer.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-white">{customer.invoices.length}</p>
            </div>
            <div className="h-px bg-white/[0.05]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 mb-1">
                Total Paid
              </p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(totalPaid, currency)}
              </p>
            </div>
          </div>

          {/* New invoice CTA */}
          <Link
            href={`/dashboard/invoices/new`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] py-3 text-xs font-medium text-neutral-600 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5 transition-all duration-150"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            New Invoice
          </Link>
        </div>

        {/* RIGHT — invoice list */}
        <div className="col-span-2">
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-3.5 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Invoice History
              </h2>
            </div>

            {customer.invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-8 w-8 text-neutral-700 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-neutral-500">No invoices yet</p>
                <p className="text-xs text-neutral-700 mt-1">
                  Create an invoice for this customer to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {customer.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/dashboard/invoices/${inv.id}`}
                    className="group flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <FileText className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-[11px] text-neutral-700">
                          {formatDate(inv.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[inv.status] ?? ""}`}>
                        {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-white">
                        {formatCurrency(inv.totalCents, inv.currency)}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-700 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all" strokeWidth={2} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
