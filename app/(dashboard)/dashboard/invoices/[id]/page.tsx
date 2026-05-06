// =============================================================================
// app/(dashboard)/invoices/[id]/page.tsx
// Server Component — fetches full invoice data, passes to InvoiceDetail client.
// =============================================================================

import { Suspense }      from "react";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth }          from "@/auth";
import { prisma }        from "@/lib/prisma";
import { InvoiceDetail } from "./invoice-detail";

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where:  { id },
    select: { invoiceNumber: true },
  });
  return {
    title: invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice",
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function InvoiceDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-white/[0.06]" />
          <div className="h-3.5 w-24 rounded bg-white/[0.04]" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-white/[0.06]" />
          <div className="h-9 w-28 rounded-lg bg-white/[0.06]" />
        </div>
      </div>
      {/* Two-col body */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="h-64 rounded-xl border border-white/[0.06] bg-[#111111]" />
          <div className="h-40 rounded-xl border border-white/[0.06] bg-[#111111]" />
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-xl border border-white/[0.06] bg-[#111111]" />
          <div className="h-32 rounded-xl border border-white/[0.06] bg-[#111111]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

async function InvoiceDetailContent({
  id,
  userId,
  justCreated,
}: {
  id:          string;
  userId:      string;
  justCreated: boolean;
}) {
  const invoice = await prisma.invoice.findFirst({
    where:   { id, userId },
    include: {
      customer: true,
      user: { include: { freelancerSettings: true } },
    },
  });

  if (!invoice) notFound();

  // Shape the data for the client component
  const settings = invoice.user.freelancerSettings;

  const lineItems = (
    invoice.lineItems as {
      description: string;
      quantity:    number;
      unitPrice:   number;
    }[]
  ).map((item) => ({
    description: item.description,
    quantity:    item.quantity,
    unitPrice:   item.unitPrice,
    total:       item.quantity * item.unitPrice,
  }));

  return (
    <InvoiceDetail
      invoice={{
        id:            invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status:        invoice.status,
        issueDate:     invoice.issueDate.toISOString(),
        dueDate:       invoice.dueDate.toISOString(),
        sentAt:        invoice.sentAt?.toISOString()   ?? null,
        viewedAt:      invoice.viewedAt?.toISOString() ?? null,
        paidAt:        invoice.paidAt?.toISOString()   ?? null,
        subtotalCents: invoice.subtotalCents,
        taxRateBps:    invoice.taxRateBps,
        taxAmountCents:invoice.taxAmountCents,
        totalCents:    invoice.totalCents,
        currency:      invoice.currency,
        notes:         invoice.notes ?? null,
        publicToken:   invoice.publicToken,
        lineItems,
      }}
      customer={{
        id:      invoice.customer.id,
        name:    invoice.customer.name,
        email:   invoice.customer.email,
        company: invoice.customer.company ?? null,
        address: invoice.customer.address ?? null,
        city:    invoice.customer.city    ?? null,
        country: invoice.customer.country ?? null,
      }}
      business={{
        name:    settings?.businessName    ?? invoice.user.name    ?? "Your Business",
        email:   settings?.businessEmail   ?? invoice.user.email   ?? "",
        address: settings?.businessAddress ?? null,
        city:    settings?.businessCity    ?? null,
        country: settings?.businessCountry ?? null,
        taxId:   settings?.taxId           ?? null,
      }}
      justCreated={justCreated}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id }      = await params;
  const { created } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl">
      <Suspense fallback={<InvoiceDetailSkeleton />}>
        <InvoiceDetailContent
          id={id}
          userId={session.user.id}
          justCreated={created === "true"}
        />
      </Suspense>
    </div>
  );
}
