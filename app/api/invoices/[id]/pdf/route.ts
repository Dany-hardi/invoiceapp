// =============================================================================
// app/api/invoices/[id]/pdf/route.ts
// GET /api/invoices/[id]/pdf
// Auth-gated route — generates PDF on-demand and streams it to the browser.
// Used for the "Download PDF" button in InvoiceDetail.
// =============================================================================

import { type NextRequest, NextResponse } from "next/server";
import { auth }                           from "@/auth";
import { generateInvoicePDF }             from "@/lib/pdf/generate-pdf";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(
  _req:    NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth guard
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: invoiceId } = await params;

  try {
    // 2. Generate PDF — ownership verified inside generateInvoicePDF
    const pdfBuffer = await generateInvoicePDF({
      invoiceId,
      userId: session.user.id,
      appUrl: APP_URL,
    });

    // 3. Stream with correct headers
    return new NextResponse(pdfBuffer, {
      status:  200,
      headers: {
        "Content-Type":        "application/pdf",
        // inline → renders in browser tab; use "attachment" to force download
        "Content-Disposition": `attachment; filename="Invoice-${invoiceId}.pdf"`,
        "Content-Length":      String(pdfBuffer.length),
        // No caching — invoices can be updated
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PDF Route]", message);

    // 404 if invoice not found / unauthorized
    if (message.includes("not found")) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
