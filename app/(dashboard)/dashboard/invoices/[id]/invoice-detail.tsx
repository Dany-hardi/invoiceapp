// =============================================================================
// app/(dashboard)/invoices/[id]/invoice-detail.tsx
// "use client" — Full invoice detail view.
// Actions: Send Email, Download PDF, Update Status, Duplicate.
// Sections: Header bar, stats, line items table, customer card, activity log.
// =============================================================================

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter }   from "next/navigation";
import Link            from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Download, Copy, ChevronDown, CheckCircle2,
  AlertTriangle, Clock, Eye, CreditCard, FileText,
  User, Building2, Mail, MapPin, ExternalLink,
  MoreHorizontal, Loader2, ArrowLeft, Zap,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  sendInvoiceEmail,
  updateInvoiceStatus,
  duplicateInvoice,
  type InvoiceActionState,
} from "./actions";
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

interface InvoiceDetailProps {
  invoice: {
    id:             string;
    invoiceNumber:  string;
    status:         InvoiceStatus;
    issueDate:      string;
    dueDate:        string;
    sentAt:         string | null;
    viewedAt:       string | null;
    paidAt:         string | null;
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
    id:      string;
    name:    string;
    email:   string;
    company: string | null;
    address: string | null;
    city:    string | null;
    country: string | null;
  };
  business: {
    name:    string;
    email:   string;
    address: string | null;
    city:    string | null;
    country: string | null;
    taxId:   string | null;
  };
  justCreated: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(cents / 100);
}

const STATUS_META: Record<InvoiceStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  DRAFT:     { label: "Draft",     color: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/25",  icon: FileText    },
  SENT:      { label: "Sent",      color: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-500/25",   icon: Send        },
  VIEWED:    { label: "Viewed",    color: "text-purple-400",  bg: "bg-purple-500/10", border: "border-purple-500/25", icon: Eye         },
  PAID:      { label: "Paid",      color: "text-green-400",   bg: "bg-green-500/10",  border: "border-green-500/25",  icon: CheckCircle2 },
  OVERDUE:   { label: "Overdue",   color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/25",    icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", color: "text-neutral-500", bg: "bg-neutral-500/10",border: "border-neutral-700/25",icon: FileText    },
};

const ALLOWED_STATUS_TRANSITIONS: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
  DRAFT:   ["SENT", "CANCELLED"],
  SENT:    ["PAID", "OVERDUE", "CANCELLED"],
  VIEWED:  ["PAID", "OVERDUE", "CANCELLED"],
  OVERDUE: ["PAID", "CANCELLED"],
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
      meta.color, meta.bg, meta.border
    )}>
      <Icon className="h-3 w-3" strokeWidth={2} />
      {meta.label}
    </span>
  );
}

function StatCard({ label, value, sub, accent }: {
  label:  string;
  value:  string;
  sub?:   string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
      <p className={cn("mb-1 text-[10px] font-semibold uppercase tracking-wider", accent)}>{label}</p>
      <p className="text-xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-600">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function InvoiceDetail({
  invoice,
  customer,
  business,
  justCreated,
}: InvoiceDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<InvoiceActionState>({ status: "idle" });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMoreMenu,   setShowMoreMenu]   = useState(false);
  const [currentStatus, setCurrentStatus]  = useState<InvoiceStatus>(invoice.status);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const portalUrl = `${APP_URL}/pay/${invoice.publicToken}`;
  const taxRate   = invoice.taxRateBps / 100;

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Actions ──────────────────────────────────────────────────────────────

  function handleSend() {
    startTransition(async () => {
      const result = await sendInvoiceEmail(invoice.id);
      setActionState(result);
      if (result.status === "success") {
        setCurrentStatus("SENT");
        setToast({ type: "success", msg: result.message });
      } else {
        setToast({ type: "error", msg: result.message });
      }
    });
  }

  function handleStatusChange(status: InvoiceStatus) {
    setShowStatusMenu(false);
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoice.id, status);
      if (result.status === "success") {
        setCurrentStatus(status);
        setToast({ type: "success", msg: result.message });
      } else {
        setToast({ type: "error", msg: result.message });
      }
    });
  }

  function handleDuplicate() {
    setShowMoreMenu(false);
    startTransition(async () => {
      const result = await duplicateInvoice(invoice.id);
      if (result.success && result.newId) {
        router.push(`/dashboard/invoices/${result.newId}?created=true`);
      } else {
        setToast({ type: "error", msg: result.error ?? "Failed to duplicate." });
      }
    });
  }

  function handleDownloadPDF() {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(portalUrl);
    setToast({ type: "success", msg: "Portal link copied to clipboard." });
  }

  const transitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
  const statusMeta  = STATUS_META[currentStatus];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ================================================================ */}
      {/* JUST-CREATED BANNER                                               */}
      {/* ================================================================ */}
      <AnimatePresence>
        {justCreated && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle2 className="h-4 w-4 text-green-400" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-300">
                  Invoice {invoice.invoiceNumber} created successfully
                </p>
                <p className="text-xs text-green-600">
                  Send it to your client or download the PDF below.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* TOAST                                                             */}
      {/* ================================================================ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg",
              toast.type === "success"
                ? "border-green-500/20 bg-[#111] text-green-300"
                : "border-red-500/20   bg-[#111] text-red-300"
            )}
          >
            {toast.type === "success"
              ? <CheckCircle2  className="h-4 w-4 flex-shrink-0 text-green-400" strokeWidth={2} />
              : <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400"   strokeWidth={2} />}
            <p className="text-sm font-medium">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* HEADER BAR                                                        */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/invoices"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-neutral-600 hover:border-white/[0.12] hover:text-neutral-300 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-white tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={currentStatus} />
            </div>
            <p className="mt-0.5 text-xs text-neutral-600">
              Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03]",
              "px-3.5 py-2 text-xs font-medium text-neutral-400",
              "hover:border-white/20 hover:text-white transition-all duration-150"
            )}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            PDF
          </button>

          {/* Copy portal link */}
          <button
            onClick={handleCopyLink}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03]",
              "px-3.5 py-2 text-xs font-medium text-neutral-400",
              "hover:border-white/20 hover:text-white transition-all duration-150"
            )}
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
            Copy Link
          </button>

          {/* Status changer */}
          {transitions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu((s) => !s)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03]",
                  "px-3.5 py-2 text-xs font-medium text-neutral-400",
                  "hover:border-white/20 hover:text-white transition-all duration-150"
                )}
              >
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                Status
              </button>
              <AnimatePresence>
                {showStatusMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-white/[0.08] bg-[#161616] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                  >
                    <div className="p-1">
                      {transitions.map((s) => {
                        const m = STATUS_META[s];
                        const I = m.icon;
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2",
                              "text-xs transition-colors duration-100",
                              "hover:bg-white/[0.05]", m.color
                            )}
                          >
                            <I className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Mark as {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Send button */}
          {currentStatus === "DRAFT" && (
            <motion.button
              onClick={handleSend}
              disabled={isPending}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2",
                "text-xs font-semibold text-white",
                "hover:bg-blue-500 transition-colors duration-150",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {isPending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                : <><Send    className="h-3.5 w-3.5" strokeWidth={2} /> Send Invoice</>
              }
            </motion.button>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu((s) => !s)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                "border border-white/[0.08] bg-white/[0.03]",
                "text-neutral-500 hover:border-white/20 hover:text-neutral-300",
                "transition-all duration-150"
              )}
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-white/[0.08] bg-[#161616] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                >
                  <div className="p-1">
                    <button
                      onClick={handleDuplicate}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-neutral-400 hover:bg-white/[0.05] hover:text-white transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Duplicate Invoice
                    </button>
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-neutral-400 hover:bg-white/[0.05] hover:text-white transition-colors"
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                      View Client Portal
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* STAT CARDS ROW                                                    */}
      {/* ================================================================ */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Due"
          value={fmt(invoice.totalCents, invoice.currency)}
          sub={`${invoice.currency} · incl. ${taxRate.toFixed(2)}% tax`}
          accent="text-blue-400"
        />
        <StatCard
          label="Subtotal"
          value={fmt(invoice.subtotalCents, invoice.currency)}
          sub="Before tax"
          accent="text-neutral-500"
        />
        <StatCard
          label="Tax Amount"
          value={fmt(invoice.taxAmountCents, invoice.currency)}
          sub={`${taxRate.toFixed(2)}% applied`}
          accent="text-neutral-500"
        />
      </div>

      {/* ================================================================ */}
      {/* MAIN BODY — 3:1 grid                                              */}
      {/* ================================================================ */}
      <div className="grid grid-cols-3 gap-5">

        {/* LEFT — Line items + notes */}
        <div className="col-span-2 space-y-5">

          {/* Line items table */}
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
            {/* Table header */}
            <div className="border-b border-white/[0.06] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Line Items
                </h2>
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/[0.06] px-1 text-[10px] text-neutral-600">
                  {invoice.lineItems.length}
                </span>
              </div>
            </div>

            {/* Col headers */}
            <div className="grid grid-cols-12 gap-3 border-b border-white/[0.04] bg-white/[0.01] px-5 py-2.5">
              {[
                { label: "Description", cls: "col-span-6 text-left" },
                { label: "Qty",         cls: "col-span-2 text-right" },
                { label: "Unit Price",  cls: "col-span-2 text-right" },
                { label: "Total",       cls: "col-span-2 text-right" },
              ].map(({ label, cls }) => (
                <p key={label} className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider text-neutral-700",
                  cls
                )}>
                  {label}
                </p>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              {invoice.lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 items-start gap-3 px-5 py-3.5">
                  <p className="col-span-6 text-sm text-neutral-200 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="col-span-2 text-right text-sm tabular-nums text-neutral-500">
                    {item.quantity}
                  </p>
                  <p className="col-span-2 text-right text-sm tabular-nums text-neutral-500">
                    {fmt(Math.round(item.unitPrice * 100), invoice.currency)}
                  </p>
                  <p className="col-span-2 text-right text-sm font-semibold tabular-nums text-white">
                    {fmt(Math.round(item.total * 100), invoice.currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals footer */}
            <div className="border-t border-white/[0.06] bg-white/[0.01] px-5 py-4">
              <div className="ml-auto w-52 space-y-2">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(invoice.subtotalCents, invoice.currency)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Tax ({taxRate.toFixed(2)}%)</span>
                    <span className="tabular-nums">{fmt(invoice.taxAmountCents, invoice.currency)}</span>
                  </div>
                )}
                <div className="h-px bg-white/[0.06]" />
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="tabular-nums text-base font-bold text-white">
                    {fmt(invoice.totalCents, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Notes
                </h2>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-400">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — Customer + Activity */}
        <div className="space-y-5">

          {/* Customer card */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Customer
              </h2>
            </div>

            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white">{customer.name}</p>
                {customer.company && (
                  <p className="text-xs text-neutral-500">{customer.company}</p>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                <Mail className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0" strokeWidth={1.75} />
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:text-blue-400 transition-colors truncate"
                >
                  {customer.email}
                </a>
              </div>
              {(customer.city || customer.country) && (
                <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0" strokeWidth={1.75} />
                  <span>{[customer.city, customer.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* From (business) */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                From
              </h2>
            </div>
            <p className="text-sm font-semibold text-white mb-1">{business.name}</p>
            <div className="space-y-1.5">
              <p className="text-xs text-neutral-500">{business.email}</p>
              {business.address && (
                <p className="text-xs text-neutral-600">{business.address}</p>
              )}
              {(business.city || business.country) && (
                <p className="text-xs text-neutral-600">
                  {[business.city, business.country].filter(Boolean).join(", ")}
                </p>
              )}
              {business.taxId && (
                <p className="text-xs text-neutral-700">Tax ID: {business.taxId}</p>
              )}
            </div>
          </div>

          {/* Activity timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Activity
              </h2>
            </div>

            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />

              {[
                {
                  label: "Invoice created",
                  date:  invoice.issueDate,
                  icon:  FileText,
                  color: "text-neutral-500",
                  dot:   "bg-neutral-700",
                },
                invoice.sentAt && {
                  label: "Sent to client",
                  date:  invoice.sentAt,
                  icon:  Send,
                  color: "text-blue-400",
                  dot:   "bg-blue-500",
                },
                invoice.viewedAt && {
                  label: "Viewed by client",
                  date:  invoice.viewedAt,
                  icon:  Eye,
                  color: "text-purple-400",
                  dot:   "bg-purple-500",
                },
                invoice.paidAt && {
                  label: "Payment received",
                  date:  invoice.paidAt,
                  icon:  CreditCard,
                  color: "text-green-400",
                  dot:   "bg-green-500",
                },
              ]
                .filter(Boolean)
                .map((event, i) => {
                  if (!event) return null;
                  const Icon = event.icon;
                  return (
                    <div key={i} className="relative flex items-start gap-3 pb-4 pl-5 last:pb-0">
                      {/* Dot */}
                      <div className={cn(
                        "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#111111]",
                        event.dot
                      )} />
                      <div className="flex-1 overflow-hidden">
                        <p className={cn("text-xs font-medium", event.color)}>
                          {event.label}
                        </p>
                        <p className="text-[11px] text-neutral-700 mt-0.5">
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Portal link card */}
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-blue-400" strokeWidth={1.75} />
              <p className="text-xs font-semibold text-blue-300">Client Portal</p>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-blue-500/80">
              Share this link with your client to let them view and pay the invoice online.
            </p>
            <button
              onClick={handleCopyLink}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg",
                "border border-blue-500/25 bg-blue-500/10 px-3 py-2",
                "text-xs font-medium text-blue-400",
                "hover:bg-blue-500/20 transition-colors duration-150"
              )}
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
              Copy Portal Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
