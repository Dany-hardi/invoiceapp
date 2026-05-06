// =============================================================================
// app/pay/[token]/success/page.tsx
// Public post-payment success screen.
// Stripe redirects here after successful checkout.
// Verifies the session via Stripe API, shows confirmation.
// =============================================================================

import Link            from "next/link";
import type { Metadata } from "next";
import Stripe            from "stripe";
import { prisma }        from "@/lib/prisma";

export const metadata: Metadata = {
  title:  "Payment Successful",
  robots: { index: false, follow: false },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(amount / 100);
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params:       Promise<{ token: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { token }      = await params;
  const { session_id } = await searchParams;

  // Fetch invoice for display
  const invoice = await prisma.invoice.findUnique({
    where:   { publicToken: token },
    include: {
      customer: true,
      user: { include: { freelancerSettings: true } },
    },
  });

  // Attempt to verify Stripe session
  let stripeVerified  = false;
  let paymentMethod   = "Card";

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia",
      });
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["payment_intent.payment_method"],
      });
      stripeVerified = session.payment_status === "paid";

      const pm = (session.payment_intent as Stripe.PaymentIntent)
        ?.payment_method as Stripe.PaymentMethod | null;
      if (pm?.card?.brand) {
        paymentMethod = `${pm.card.brand.charAt(0).toUpperCase()}${pm.card.brand.slice(1)} •••• ${pm.card.last4}`;
      }
    } catch {
      // Non-fatal — still show success screen
    }
  }

  const businessName = invoice?.user.freelancerSettings?.businessName
    ?? invoice?.user.name
    ?? "Your vendor";

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-green-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-sm font-bold text-white">I</span>
          </div>
          <span className="text-base font-semibold text-white tracking-tight">
            InvoiceApp
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]">

          {/* Success header */}
          <div className="bg-gradient-to-b from-green-500/10 to-transparent px-8 pt-8 pb-6 text-center border-b border-white/[0.05]">
            {/* Animated check */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
              <svg
                className="h-8 w-8 text-green-400"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="16" cy="16" r="14" opacity="0.3" />
                <path d="M10 16l4.5 4.5 7.5-9" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              Payment received
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Your payment to{" "}
              <span className="font-semibold text-neutral-200">{businessName}</span>{" "}
              was processed successfully.
            </p>
          </div>

          {/* Receipt details */}
          {invoice && (
            <div className="px-8 py-6 space-y-4">
              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">
                  Amount Paid
                </span>
                <span className="text-xl font-bold text-white tabular-nums">
                  {fmt(invoice.totalCents, invoice.currency)}
                </span>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Details grid */}
              {[
                { label: "Invoice",    value: invoice.invoiceNumber },
                { label: "Billed to",  value: invoice.customer.name },
                { label: "Paid on",    value: fmtDate(invoice.paidAt ?? new Date()) },
                { label: "Method",     value: paymentMethod },
                ...(stripeVerified ? [{ label: "Status", value: "✓ Verified by Stripe" }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600">{label}</span>
                  <span className={`text-xs font-medium ${label === "Status" ? "text-green-400" : "text-neutral-300"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="border-t border-white/[0.05] bg-white/[0.01] px-8 py-5 space-y-3">
            <a
              href={`/pay/${token}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-neutral-400 hover:text-white hover:border-white/20 transition-all duration-150"
            >
              View Invoice
            </a>
            <p className="text-center text-xs text-neutral-700">
              A receipt has been sent to{" "}
              <span className="text-neutral-600">{invoice?.customer.email}</span>
            </p>
          </div>
        </div>

        {/* Powered by */}
        <p className="mt-6 text-center text-xs text-neutral-800">
          Powered by <span className="text-neutral-700">InvoiceApp</span> &amp; Stripe
        </p>
      </div>
    </main>
  );
}
