// =============================================================================
// lib/pdf/generate-pdf.ts
// Server-only utility — fetches invoice from DB, assembles InvoicePDFData,
// renders to a Buffer via @react-pdf/renderer renderToBuffer.
// =============================================================================

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { InvoicePDF, type InvoicePDFData } from "./invoice-pdf";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneratePDFOptions {
  invoiceId:  string;
  userId:     string;  // Ownership guard — never serve another user's invoice
  appUrl:     string;  // e.g. "https://yourdomain.com" for portal link
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateInvoicePDF({
  invoiceId,
  userId,
  appUrl,
}: GeneratePDFOptions): Promise<Buffer> {
  // 1. Fetch invoice with all relations in a single query
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      customer: true,
      user: {
        include: { freelancerSettings: true },
      },
    },
  });

  if (!invoice) {
    throw new Error(`Invoice not found or unauthorized: ${invoiceId}`);
  }

  const settings = invoice.user.freelancerSettings;
  const customer = invoice.customer;

  // 2. Parse line items from JSON (stored as Prisma Json field)
  const rawItems = invoice.lineItems as {
    description: string;
    quantity:    number;
    unitPrice:   number;
  }[];

  const lineItems = rawItems.map((item) => ({
    description: item.description,
    quantity:    item.quantity,
    unitPrice:   item.unitPrice,
    total:       item.quantity * item.unitPrice,
  }));

  // 3. Convert cents to display amounts
  const subtotal  = invoice.subtotalCents  / 100;
  const taxAmount = invoice.taxAmountCents / 100;
  const total     = invoice.totalCents     / 100;
  const taxRate   = invoice.taxRateBps     / 100; // bps → percent

  // 4. Assemble PDF data
  const data: InvoicePDFData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate:     invoice.issueDate.toISOString(),
    dueDate:       invoice.dueDate.toISOString(),
    status:        invoice.status,
    currency:      invoice.currency,
    notes:         invoice.notes,
    subtotal,
    taxRate,
    taxAmount,
    total,
    lineItems,
    customer: {
      name:    customer.name,
      email:   customer.email,
      company: customer.company,
      address: customer.address,
      city:    customer.city,
      country: customer.country,
    },
    business: {
      name:    settings?.businessName    ?? invoice.user.name    ?? "Your Business",
      email:   settings?.businessEmail   ?? invoice.user.email   ?? "",
      address: settings?.businessAddress ?? null,
      city:    settings?.businessCity    ?? null,
      country: settings?.businessCountry ?? null,
      taxId:   settings?.taxId           ?? null,
      phone:   settings?.businessPhone   ?? null,
    },
    portalUrl: `${appUrl}/pay/${invoice.publicToken}`,
  };

  // 5. Render to buffer
  // renderToBuffer is the Node.js API for @react-pdf/renderer v4+
  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF, { data })
  );

  return Buffer.from(buffer);
}
