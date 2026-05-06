// =============================================================================
// app/pay/[token]/page.tsx
// PUBLIC route — no authentication required.
// Fetches invoice by publicToken (unguessable cuid), renders portal view.
// Stamps viewedAt on first load if invoice is SENT.
// =============================================================================

import { notFound }    from "next/navigation";
import type { Metadata } from "next";
import { prisma }      from "@/lib/prisma";
import { PortalView }  from "./portal-view";

// ---------------------------------------------------------------------------
// Dynamic metadata — use invoice data for better link previews
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where:   { publicToken: token },
    select:  {
      invoiceNumber: true,
      totalCents:    true,
      currency:      true,
      user: { include: { freelancerSettings: { select: { businessName: true } } } },
    },
  });

  if (!invoice) return { title: "Invoice Not Found" };

  const biz = invoice.user.freelancerSettings?.businessName ?? "Invoice";
  const amt = new Intl.NumberFormat("en-US", {
    style: "currency", currency: invoice.currency,
  }).format(invoice.totalCents / 100);

  return {
    title:       `Invoice ${invoice.invoiceNumber} — ${amt}`,
    description: `Pay invoice ${invoice.invoiceNumber} from ${biz}`,
    robots:      { index: false, follow: false }, // never index public invoice URLs
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PayPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // 1. Fetch full invoice by publicToken
  const invoice = await prisma.invoice.findUnique({
    where:   { publicToken: token },
    include: {
      customer: true,
      user: { include: { freelancerSettings: true } },
    },
  });

  if (!invoice) notFound();

  // 2. Stamp viewedAt on first client view (non-blocking — fire and forget)
  if (invoice.status === "SENT" && !invoice.viewedAt) {
    prisma.invoice.update({
      where: { id: invoice.id },
      data:  { status: "VIEWED", viewedAt: new Date() },
    }).catch(console.error); // don't await — don't block render
  }

  // 3. Parse line items
  const lineItems = (invoice.lineItems as {
    description: string;
    quantity:    number;
    unitPrice:   number;
  }[]).map((li) => ({
    description: li.description,
    quantity:    li.quantity,
    unitPrice:   li.unitPrice,
    total:       li.quantity * li.unitPrice,
  }));

  const settings = invoice.user.freelancerSettings;

  return (
    <PortalView
      invoice={{
        id:             invoice.id,
        invoiceNumber:  invoice.invoiceNumber,
        status:         invoice.status,
        issueDate:      invoice.issueDate.toISOString(),
        dueDate:        invoice.dueDate.toISOString(),
        subtotalCents:  invoice.subtotalCents,
        taxRateBps:     invoice.taxRateBps,
        taxAmountCents: invoice.taxAmountCents,
        totalCents:     invoice.totalCents,
        currency:       invoice.currency,
        notes:          invoice.notes ?? null,
        publicToken:    invoice.publicToken,
        lineItems,
      }}
      customer={{
        name:    invoice.customer.name,
        email:   invoice.customer.email,
        company: invoice.customer.company ?? null,
        country: invoice.customer.country ?? null,
      }}
      business={{
        name:        settings?.businessName    ?? invoice.user.name    ?? "Your Business",
        email:       settings?.businessEmail   ?? invoice.user.email   ?? "",
        address:     settings?.businessAddress ?? null,
        city:        settings?.businessCity    ?? null,
        country:     settings?.businessCountry ?? null,
        taxId:       settings?.taxId           ?? null,
        bankName:    settings?.bankName        ?? null,
        accountName: settings?.accountName     ?? null,
        iban:        settings?.iban            ?? null,
        swiftCode:   settings?.swiftCode       ?? null,
      }}
      stripeEnabled={!!settings?.stripePublishableKey}
    />
  );
}
