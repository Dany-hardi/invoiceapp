// =============================================================================
// app/api/webhooks/stripe/route.ts
// POST /api/webhooks/stripe
// Stripe webhook handler — signature-verified, idempotent.
//
// Events handled:
//   checkout.session.completed → mark invoice PAID, stamp paidAt
//   payment_intent.payment_failed → log (future: notify freelancer)
//
// Security: raw body is verified against STRIPE_WEBHOOK_SECRET before ANY
// processing. Reject anything that fails signature check with 400.
// =============================================================================

import { type NextRequest, NextResponse } from "next/server";
import Stripe                              from "stripe";
import { prisma }                          from "@/lib/prisma";
import { revalidatePath }                  from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Read raw body — MUST be raw bytes for Stripe signature verification.
  //    Never parse with req.json() first — it will break the signature.
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  // 2. Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Signature verification failed: ${msg}`);
    return new NextResponse(`Webhook signature verification failed: ${msg}`, {
      status: 400,
    });
  }

  // 3. Idempotency — log event type
  console.log(`[Stripe Webhook] Received: ${event.type} | ID: ${event.id}`);

  // 4. Handle events
  try {
    switch (event.type) {
      // -------------------------------------------------------------------- //
      // PAYMENT SUCCESS                                                       //
      // -------------------------------------------------------------------- //
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract invoice ID from metadata (set when creating session)
        const invoiceId = session.metadata?.invoiceId;
        if (!invoiceId) {
          console.warn("[Stripe Webhook] checkout.session.completed missing invoiceId metadata");
          break;
        }

        // Idempotency guard — only update if not already PAID
        const invoice = await prisma.invoice.findUnique({
          where:  { id: invoiceId },
          select: { id: true, status: true, publicToken: true, userId: true },
        });

        if (!invoice) {
          console.warn(`[Stripe Webhook] Invoice not found: ${invoiceId}`);
          break;
        }

        if (invoice.status === "PAID") {
          // Already processed — return 200 to acknowledge receipt
          console.log(`[Stripe Webhook] Invoice ${invoiceId} already PAID — skipping`);
          break;
        }

        // Mark as PAID
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status:                 "PAID",
            paidAt:                 new Date(),
            stripePaymentIntentId:  session.payment_intent as string ?? null,
            stripeCheckoutSessionId: session.id,
          },
        });

        console.log(`[Stripe Webhook] ✓ Invoice ${invoiceId} marked PAID`);

        // Revalidate relevant pages
        revalidatePath(`/dashboard/invoices/${invoiceId}`);
        revalidatePath(`/dashboard/invoices`);
        revalidatePath(`/dashboard`);
        revalidatePath(`/pay/${invoice.publicToken}`);
        break;
      }

      // -------------------------------------------------------------------- //
      // PAYMENT FAILED                                                        //
      // -------------------------------------------------------------------- //
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoiceId;
        const reason    = pi.last_payment_error?.message ?? "Unknown reason";
        console.warn(
          `[Stripe Webhook] Payment failed for invoice ${invoiceId}: ${reason}`
        );
        // Future: send email to freelancer, update invoice with failed attempt log
        break;
      }

      // -------------------------------------------------------------------- //
      // PAYMENT INTENT SUCCEEDED (belt-and-suspenders alongside session)     //
      // -------------------------------------------------------------------- //
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoiceId;
        if (!invoiceId) break;

        // Only act if invoice is not yet PAID (idempotency)
        const existing = await prisma.invoice.findUnique({
          where:  { id: invoiceId },
          select: { status: true },
        });

        if (existing && existing.status !== "PAID") {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data:  {
              status:                "PAID",
              paidAt:                new Date(),
              stripePaymentIntentId: pi.id,
            },
          });
          console.log(`[Stripe Webhook] ✓ Invoice ${invoiceId} marked PAID via payment_intent.succeeded`);
        }
        break;
      }

      // -------------------------------------------------------------------- //
      // UNHANDLED — acknowledge without error                                 //
      // -------------------------------------------------------------------- //
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    // Return 500 so Stripe retries the webhook
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  // 5. Always return 200 to acknowledge receipt
  return new NextResponse("OK", { status: 200 });
}

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = {
  api: { bodyParser: false },
};
