// =============================================================================
// app/pay/[token]/actions.ts
// Server Actions for the public payment portal.
// createCheckoutSession — creates a Stripe Checkout session for an invoice.
// =============================================================================

"use server";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckoutSessionResult =
  | { success: true;  url: string }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// createCheckoutSession
// Looks up the invoice by publicToken (no auth — public route),
// builds Stripe line items from invoice data, creates a Checkout Session,
// returns the session URL for client-side redirect.
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  publicToken: string
): Promise<CheckoutSessionResult> {
  // 1. Fetch invoice + business settings
  const invoice = await prisma.invoice.findUnique({
    where:   { publicToken },
    include: {
      customer: true,
      user: { include: { freelancerSettings: true } },
    },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found." };
  }

  // 2. Guard — only allow payment on payable statuses
  if (invoice.status === "PAID") {
    return { success: false, error: "This invoice has already been paid." };
  }
  if (invoice.status === "CANCELLED") {
    return { success: false, error: "This invoice has been cancelled." };
  }

  // 3. Get Stripe secret key from environment
  //    (In production you'd decrypt the stored key — for now use env var)
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return {
      success: false,
      error:   "Payment processing is not configured. Please contact the sender.",
    };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

  // 4. Parse line items from JSON
  const rawItems = invoice.lineItems as {
    description: string;
    quantity:    number;
    unitPrice:   number;
  }[];

  // 5. Build Stripe line items
  //    Stripe works in smallest currency unit (cents) — already stored that way
  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    rawItems.map((item) => ({
      price_data: {
        currency:     invoice.currency.toLowerCase(),
        unit_amount:  Math.round(item.unitPrice * 100), // dollars → cents
        product_data: { name: item.description },
      },
      quantity: item.quantity,
    }));

  // Add tax as a separate line item if applicable
  if (invoice.taxAmountCents > 0) {
    stripeLineItems.push({
      price_data: {
        currency:     invoice.currency.toLowerCase(),
        unit_amount:  invoice.taxAmountCents,
        product_data: {
          name: `Tax (${(invoice.taxRateBps / 100).toFixed(2)}%)`,
        },
      },
      quantity: 1,
    });
  }

  try {
    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode:               "payment",
      payment_method_types: ["card"],
      line_items:         stripeLineItems,
      customer_email:     invoice.customer.email,
      client_reference_id: invoice.id,      // used in webhook to find invoice
      success_url: `${APP_URL}/pay/${publicToken}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/pay/${publicToken}?cancelled=true`,

      // Metadata — passed through to webhook
      metadata: {
        invoiceId:    invoice.id,
        publicToken:  invoice.publicToken,
        invoiceNumber: invoice.invoiceNumber,
      },

      // Invoice-level description
      payment_intent_data: {
        description: `Invoice ${invoice.invoiceNumber} — ${invoice.user.freelancerSettings?.businessName ?? ""}`,
        metadata: {
          invoiceId:     invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      },
    });

    if (!session.url) {
      return { success: false, error: "Failed to create payment session." };
    }

    // 7. Save checkout session ID to invoice for reconciliation
    await prisma.invoice.update({
      where: { id: invoice.id },
      data:  { stripeCheckoutSessionId: session.id },
    });

    return { success: true, url: session.url };
  } catch (err) {
    const msg = err instanceof Stripe.errors.StripeError
      ? err.message
      : "An unexpected error occurred.";
    console.error("[createCheckoutSession]", err);
    return { success: false, error: msg };
  }
}
