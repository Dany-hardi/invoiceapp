// =============================================================================
// app/pay/[token]/portal-view.tsx
// "use client" — Public invoice portal UI.
// States: payable, already paid, cancelled, overdue.
// Stripe Checkout redirect on "Pay Now".
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, CheckCircle2, AlertTriangle, Clock,
  FileText, Building2, User, Loader2, Lock,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { createCheckoutSession } from "./actions";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  description: string;
  quantity:    number;
  unitPrice:   number;
  total:       number;
}

interface PortalViewProps {
  invoice: {
    id:             string;
    invoiceNumber:  string;
    status:         InvoiceStatus;
    issueDate:      string;
    dueDate:        string;
    subtotalCents:  number;
    taxRateBps:     number;
    taxAmountCents: number;
    totalCents:     number;
    currency:       string;
    notes:          string | null;
    publicToken:    string;
    lineItems:      LineItem[];
  };
  customer: {
    name:    string;
    email:   string;
    company: string | null;
    country: string | null;
  };
  business: {
    name:        string;
    email:       string;
    address:     string | null;
    city:        string | null;
    country:     string | null;
    taxId:       string | null;
    bankName:    string | null;
    accountName: string | null;
    iban:        string | null;
    swiftCode:   string | null;
  };
  stripeEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function isOverdue(dueDateIso: string, status: InvoiceStatus): boolean {
  return (
    status !== "PAID" &&
    status !== "CANCELLED" &&
    new Date(dueDateIso) < new Date()
  );
}

// ---------------------------------------------------------------------------
// Status banner
// ---------------------------------------------------------------------------

function StatusBanner({ status, dueDate }: { status: InvoiceStatus; dueDate: string }) {
  const overdue = isOverdue(dueDate, status);

  if (status === "PAID") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-500/15">
          <CheckCircle2 className="h-5 w-5 text-green-400" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-300">Payment received</p>
          <p className="text-xs text-green-700">Thank you — this invoice has been paid.</p>
        </div>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-neutral-700/30 bg-neutral-800/20 px-5 py-4">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-neutral-600" strokeWidth={1.75} />
        <div>
          <p className="text-sm font-semibold text-neutral-500">Invoice cancelled</p>
          <p className="text-xs text-neutral-700">This invoice is no longer active.</p>
        </div>
      </div>
    );
  }

  if (overdue) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15">
          <Clock className="h-5 w-5 text-red-400" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-300">Payment overdue</p>
          <p className="text-xs text-red-700">
            This invoice was due on {fmtDate(dueDate)}. Please pay as soon as possible.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PortalView({
  invoice,
  customer,
  business,
  stripeEnabled,
}: PortalViewProps) {
  const [isPending, startTransition] = useTransition();
  const [error,     setError]        = useState<string | null>(null);
  const [showItems, setShowItems]    = useState(true);
  const [showBank,  setShowBank]     = useState(false);

  const overdue     = isOverdue(invoice.dueDate, invoice.status);
  const canPay      = !["PAID", "CANCELLED"].includes(invoice.status);
  const taxRate     = invoice.taxRateBps / 100;
  const hasBankInfo = business.bankName || business.iban || business.swiftCode;

  // ── Stripe checkout ───────────────────────────────────────────────────────

  function handlePay() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(invoice.publicToken);
      if (result.success) {
        window.location.href = result.url;
      } else {
        setError(result.error);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-12">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-blue-600/4 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl space-y-5">

        {/* ================================================================ */}
        {/* BRAND HEADER                                                      */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
              <span className="text-xs font-bold text-white">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              {business.name}
            </span>
          </div>
          <span className="text-xs text-neutral-700">
            Powered by InvoiceApp
          </span>
        </div>

        {/* ================================================================ */}
        {/* STATUS BANNER                                                     */}
        {/* ================================================================ */}
        <StatusBanner status={invoice.status} dueDate={invoice.dueDate} />

        {/* ================================================================ */}
        {/* MAIN CARD                                                         */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
        >

          {/* ── Header band ──────────────────────────────────────────────── */}
          <div className="bg-[#0A0A0A] px-7 py-6 border-b border-white/[0.06]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 mb-1">
                  Invoice
                </p>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {invoice.invoiceNumber}
                </h1>
                <p className="mt-1.5 text-xs text-neutral-600">
                  Issued {fmtDate(invoice.issueDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 mb-1">
                  Amount Due
                </p>
                <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {fmt(invoice.totalCents, invoice.currency)}
                </p>
                <p className={cn(
                  "mt-1.5 text-xs font-medium",
                  overdue ? "text-red-400" : "text-neutral-500"
                )}>
                  Due {fmtDate(invoice.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* ── From / To ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 border-b border-white/[0.06] divide-x divide-white/[0.06]">
            <div className="px-7 py-5">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-700">
                From
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">
                  {business.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{business.name}</p>
                  <p className="text-xs text-neutral-600">{business.email}</p>
                </div>
              </div>
              {(business.city || business.country) && (
                <p className="mt-2 text-xs text-neutral-700 pl-[42px]">
                  {[business.city, business.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            <div className="px-7 py-5">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-700">
                Billed To
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm font-bold text-neutral-400">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{customer.name}</p>
                  {customer.company && (
                    <p className="text-xs text-neutral-600">{customer.company}</p>
                  )}
                  <p className="text-xs text-neutral-700">{customer.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Line items (collapsible) ──────────────────────────────────── */}
          <div className="border-b border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowItems((s) => !s)}
              className="flex w-full items-center justify-between px-7 py-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Line Items
                </span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/[0.06] px-1 text-[10px] text-neutral-600">
                  {invoice.lineItems.length}
                </span>
              </div>
              {showItems
                ? <ChevronUp   className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2} />
                : <ChevronDown className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2} />
              }
            </button>

            <AnimatePresence initial={false}>
              {showItems && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  {/* Col headers */}
                  <div className="grid grid-cols-12 gap-3 bg-white/[0.01] px-7 py-2.5 border-t border-white/[0.04]">
                    {[
                      { label: "Description", cls: "col-span-6 text-left"  },
                      { label: "Qty",         cls: "col-span-2 text-right" },
                      { label: "Price",       cls: "col-span-2 text-right" },
                      { label: "Total",       cls: "col-span-2 text-right" },
                    ].map(({ label, cls }) => (
                      <span key={label} className={cn(
                        "text-[9px] font-semibold uppercase tracking-wider text-neutral-700",
                        cls
                      )}>
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="divide-y divide-white/[0.03]">
                    {invoice.lineItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 items-center gap-3 px-7 py-3.5">
                        <p className="col-span-6 text-sm text-neutral-300 leading-relaxed">
                          {item.description}
                        </p>
                        <p className="col-span-2 text-right text-sm tabular-nums text-neutral-600">
                          {item.quantity}
                        </p>
                        <p className="col-span-2 text-right text-sm tabular-nums text-neutral-600">
                          {fmt(Math.round(item.unitPrice * 100), invoice.currency)}
                        </p>
                        <p className="col-span-2 text-right text-sm font-semibold tabular-nums text-white">
                          {fmt(Math.round(item.total * 100), invoice.currency)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-white/[0.05] bg-white/[0.01] px-7 py-4">
                    <div className="ml-auto w-56 space-y-1.5">
                      <div className="flex justify-between text-xs text-neutral-600">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{fmt(invoice.subtotalCents, invoice.currency)}</span>
                      </div>
                      {taxRate > 0 && (
                        <div className="flex justify-between text-xs text-neutral-600">
                          <span>Tax ({taxRate.toFixed(2)}%)</span>
                          <span className="tabular-nums">{fmt(invoice.taxAmountCents, invoice.currency)}</span>
                        </div>
                      )}
                      <div className="h-px bg-white/[0.06]" />
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-white">Total</span>
                        <span className="text-base font-bold tabular-nums text-white">
                          {fmt(invoice.totalCents, invoice.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Notes ────────────────────────────────────────────────────── */}
          {invoice.notes && (
            <div className="border-b border-white/[0.06] px-7 py-5">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-700">
                Notes
              </p>
              <p className="text-sm leading-relaxed text-neutral-500 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* ── Bank transfer details (collapsible) ──────────────────────── */}
          {hasBankInfo && (
            <div className="border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowBank((s) => !s)}
                className="flex w-full items-center justify-between px-7 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Bank Transfer Details
                  </span>
                </div>
                {showBank
                  ? <ChevronUp   className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2} />
                  : <ChevronDown className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2} />
                }
              </button>

              <AnimatePresence initial={false}>
                {showBank && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 border-t border-white/[0.04] px-7 py-5">
                      {[
                        { label: "Bank",         value: business.bankName    },
                        { label: "Account Name", value: business.accountName },
                        { label: "IBAN",         value: business.iban        },
                        { label: "SWIFT / BIC",  value: business.swiftCode   },
                      ]
                        .filter((r) => r.value)
                        .map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                              {label}
                            </p>
                            <p className="text-sm font-medium text-neutral-300 font-mono tracking-wide">
                              {value}
                            </p>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── PAY NOW CTA ──────────────────────────────────────────────── */}
          {canPay && (
            <div className="px-7 py-6 space-y-4">
              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300 overflow-hidden"
                  >
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" strokeWidth={1.75} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {stripeEnabled ? (
                <>
                  <motion.button
                    onClick={handlePay}
                    disabled={isPending}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "flex w-full items-center justify-center gap-3 rounded-xl",
                      "bg-blue-600 px-6 py-4",
                      "text-base font-bold text-white tracking-tight",
                      "hover:bg-blue-500 transition-colors duration-150",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      "shadow-[0_4px_24px_rgba(59,130,246,0.25)]"
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isPending ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3"
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Redirecting to payment…
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3"
                        >
                          <CreditCard className="h-5 w-5" strokeWidth={2} />
                          Pay {fmt(invoice.totalCents, invoice.currency)} Now
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-neutral-700">
                      <Lock className="h-3 w-3" strokeWidth={2} />
                      <span className="text-[11px]">SSL Secured</span>
                    </div>
                    <div className="h-3 w-px bg-white/[0.08]" />
                    <div className="flex items-center gap-1.5 text-neutral-700">
                      <ExternalLink className="h-3 w-3" strokeWidth={2} />
                      <span className="text-[11px]">Powered by Stripe</span>
                    </div>
                    <div className="h-3 w-px bg-white/[0.08]" />
                    <span className="text-[11px] text-neutral-700">256-bit encryption</span>
                  </div>
                </>
              ) : (
                /* Stripe not configured — show bank transfer prompt */
                <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 px-5 py-4 text-center">
                  <p className="text-sm font-medium text-amber-300 mb-1">
                    Bank transfer only
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Online card payment is not enabled for this invoice.
                    Please use the bank details above to complete your payment.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
