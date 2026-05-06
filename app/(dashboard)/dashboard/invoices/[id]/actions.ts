// =============================================================================
// app/(dashboard)/invoices/[id]/actions.ts
// Server Actions for invoice detail page:
//   - sendInvoiceEmail  → generates PDF + sends via Resend
//   - updateInvoiceStatus → DRAFT/SENT/CANCELLED/etc.
//   - duplicateInvoice  → clone invoice as new DRAFT
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect }       from "next/navigation";
import { Resend }         from "resend";
import { auth }           from "@/auth";
import { prisma }         from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/pdf/generate-pdf";
import { invoiceEmail }       from "@/lib/emails/invoice-email";
import { generateInvoiceNumber } from "@/lib/invoice-id";
import type { InvoiceStatus }    from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helper — format money for email template (display string)
// ---------------------------------------------------------------------------

function fmtMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style:                 "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year:  "numeric",
    month: "long",
    day:   "numeric",
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error";   message: string };

// ---------------------------------------------------------------------------
// sendInvoiceEmail
// Generates PDF buffer → sends via Resend with attachment → marks SENT
// ---------------------------------------------------------------------------

export async function sendInvoiceEmail(
  invoiceId: string
): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  try {
    // 1. Fetch full invoice
    const invoice = await prisma.invoice.findFirst({
      where:   { id: invoiceId, userId },
      include: {
        customer: true,
        user: { include: { freelancerSettings: true } },
      },
    });

    if (!invoice) {
      return { status: "error", message: "Invoice not found." };
    }

    const settings = invoice.user.freelancerSettings;

    // 2. Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF({
      invoiceId,
      userId,
      appUrl: APP_URL,
    });

    // 3. Build line items for email
    const rawItems = invoice.lineItems as {
      description: string;
      quantity:    number;
      unitPrice:   number;
    }[];

    const emailLineItems = rawItems.map((item) => ({
      description: item.description,
      quantity:    item.quantity,
      unitPrice:   fmtMoney(Math.round(item.unitPrice * 100), invoice.currency),
      total:       fmtMoney(Math.round(item.quantity * item.unitPrice * 100), invoice.currency),
    }));

    // 4. Build email HTML
    const html = invoiceEmail({
      invoiceNumber: invoice.invoiceNumber,
      businessName:  settings?.businessName  ?? invoice.user.name  ?? "Your Business",
      businessEmail: settings?.businessEmail ?? invoice.user.email ?? "",
      customerName:  invoice.customer.name,
      issueDate:     fmtDate(invoice.issueDate),
      dueDate:       fmtDate(invoice.dueDate),
      total:         fmtMoney(invoice.totalCents,     invoice.currency),
      subtotal:      fmtMoney(invoice.subtotalCents,  invoice.currency),
      taxAmount:     fmtMoney(invoice.taxAmountCents, invoice.currency),
      taxRate:       invoice.taxRateBps / 100,
      currency:      invoice.currency,
      lineItems:     emailLineItems,
      notes:         invoice.notes,
      portalUrl:     `${APP_URL}/pay/${invoice.publicToken}`,
    });

    // 5. Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const fromName  = settings?.businessName  ?? "InvoiceApp";
    const fromEmail = process.env.EMAIL_FROM  ?? "noreply@invoiceapp.com";

    const { error: sendError } = await resend.emails.send({
      from:    `${fromName} <${fromEmail}>`,
      to:      invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${fromName} — ${fmtMoney(invoice.totalCents, invoice.currency)} due ${fmtDate(invoice.dueDate)}`,
      html,
      attachments: [
        {
          filename:    `Invoice-${invoice.invoiceNumber}.pdf`,
          content:     pdfBuffer.toString("base64"),
          contentType: "application/pdf",
        },
      ],
    });

    if (sendError) {
      console.error("[sendInvoiceEmail] Resend error:", sendError);
      return {
        status:  "error",
        message: `Failed to send email: ${sendError.message}`,
      };
    }

    // 6. Mark invoice as SENT + stamp sentAt
    await prisma.invoice.update({
      where: { id: invoiceId },
      data:  {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");

    return {
      status:  "success",
      message: `Invoice sent to ${invoice.customer.email}`,
    };
  } catch (err) {
    console.error("[sendInvoiceEmail]", err);
    return {
      status:  "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// updateInvoiceStatus
// ---------------------------------------------------------------------------

export async function updateInvoiceStatus(
  invoiceId: string,
  status:    InvoiceStatus
): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    await prisma.invoice.update({
      where: { id: invoiceId, userId: session.user.id },
      data:  { status },
    });

    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    revalidatePath("/dashboard/invoices");

    return { status: "success", message: `Status updated to ${status}.` };
  } catch {
    return { status: "error", message: "Failed to update status." };
  }
}

// ---------------------------------------------------------------------------
// duplicateInvoice — clone as DRAFT with a new invoice number
// ---------------------------------------------------------------------------

export async function duplicateInvoice(
  invoiceId: string
): Promise<{ success: boolean; newId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  try {
    const original = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!original) return { success: false, error: "Invoice not found." };

    const newNumber = await generateInvoiceNumber(userId);

    const duplicate = await prisma.invoice.create({
      data: {
        userId,
        customerId:    original.customerId,
        invoiceNumber: newNumber,
        status:        "DRAFT",
        issueDate:     new Date(),
        dueDate:       new Date(Date.now() + 30 * 86_400_000),
        subtotalCents: original.subtotalCents,
        taxRateBps:    original.taxRateBps,
        taxAmountCents: original.taxAmountCents,
        totalCents:    original.totalCents,
        currency:      original.currency,
        lineItems:     original.lineItems,
        notes:         original.notes,
      },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true, newId: duplicate.id };
  } catch (err) {
    console.error("[duplicateInvoice]", err);
    return { success: false, error: "Failed to duplicate invoice." };
  }
}
