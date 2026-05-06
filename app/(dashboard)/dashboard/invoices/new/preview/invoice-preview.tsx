// =============================================================================
// app/(dashboard)/invoices/new/preview/invoice-preview.tsx
// Live PDF-style invoice preview.
// Receives deferred form values — never blocks input, always in sync.
// =============================================================================

"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeTotals } from "@/lib/schemas/invoice.schema";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FreelancerSettings {
  businessName:    string;
  businessEmail:   string;
  businessAddress: string;
  businessCity:    string;
  businessCountry: string;
  taxId:           string;
  logoUrl:         string;
  defaultCurrency: string;
  invoicePrefix:   string;
}

interface InvoicePreviewProps {
  formValues: Partial<InvoiceFormValues>;
  settings:   FreelancerSettings;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style:                 "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Preview Component
// ---------------------------------------------------------------------------

export function InvoicePreview({ formValues, settings }: InvoicePreviewProps) {
  const currency  = formValues.currency  ?? settings.defaultCurrency ?? "USD";
  const prefix    = formValues.invoicePrefix ?? settings.invoicePrefix ?? "INV";
  const lineItems = formValues.lineItems ?? [];
  const taxRate   = Number(formValues.taxRate ?? 0);

  const { subtotalCents, taxAmountCents, totalCents } = useMemo(
    () => computeTotals(
      lineItems.map((li) => ({
        quantity:  Number(li?.quantity  ?? 0),
        unitPrice: Number(li?.unitPrice ?? 0),
      })),
      taxRate
    ),
    [lineItems, taxRate]
  );

  // Customer display
  const customerName =
    formValues.customerMode === "new"
      ? formValues.newCustomer?.name  || "Client Name"
      : "Selected Client";
  const customerEmail =
    formValues.customerMode === "new"
      ? formValues.newCustomer?.email || ""
      : "";
  const customerCompany =
    formValues.customerMode === "new"
      ? formValues.newCustomer?.company || ""
      : "";
  const customerCountry =
    formValues.customerMode === "new"
      ? formValues.newCustomer?.country || ""
      : "";

  const hasItems = lineItems.length > 0 && lineItems.some(
    (li) => li?.description || (li?.quantity && li?.unitPrice)
  );

  return (
    <div className="mx-auto max-w-[540px]">
      {/* Preview label */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.04]" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-700">
          Preview
        </span>
        <div className="h-px flex-1 bg-white/[0.04]" />
      </div>

      {/* ================================================================== */}
      {/* Invoice "paper" — mimics the PDF output                              */}
      {/* ================================================================== */}
      <motion.div
        layout
        className="rounded-2xl border border-white/[0.07] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* ---------------------------------------------------------------- */}
        {/* HEADER BAND                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="bg-[#0A0A0A] px-8 py-6">
          <div className="flex items-start justify-between">
            {/* Left — logo + business name */}
            <div>
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt={settings.businessName}
                  className="mb-2 h-8 object-contain"
                />
              ) : (
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                  <span className="text-sm font-bold text-white">
                    {(settings.businessName || "I").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-sm font-bold text-white tracking-tight">
                {settings.businessName || "Your Business Name"}
              </p>
              {settings.businessEmail && (
                <p className="text-xs text-neutral-500 mt-0.5">{settings.businessEmail}</p>
              )}
              {(settings.businessCity || settings.businessCountry) && (
                <p className="text-xs text-neutral-600 mt-0.5">
                  {[settings.businessCity, settings.businessCountry].filter(Boolean).join(", ")}
                </p>
              )}
              {settings.taxId && (
                <p className="text-xs text-neutral-700 mt-0.5">Tax ID: {settings.taxId}</p>
              )}
            </div>

            {/* Right — INVOICE label + number */}
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Invoice
              </p>
              <p className="mt-0.5 text-lg font-bold text-white tracking-tight">
                {prefix}-
                <span className="text-neutral-500">XXXXXXXXX</span>
              </p>

              <div className="mt-3 space-y-0.5">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[10px] text-neutral-600">Issued</span>
                  <span className="text-[11px] font-medium text-neutral-300 w-28 text-right">
                    {fmtDate(formValues.issueDate)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[10px] text-neutral-600">Due</span>
                  <span className="text-[11px] font-medium text-neutral-300 w-28 text-right">
                    {fmtDate(formValues.dueDate)}
                  </span>
                </div>
              </div>

              {/* Status pill */}
              <div className="mt-3 flex justify-end">
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  Draft
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* BILL TO / FROM ROW                                                 */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 border-b border-neutral-100 bg-neutral-50 px-8 py-5">
          <div>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Bill To
            </p>
            <p className="text-sm font-semibold text-neutral-800">
              {customerName || <span className="text-neutral-300 italic">Client name</span>}
            </p>
            {customerCompany && (
              <p className="text-xs text-neutral-500">{customerCompany}</p>
            )}
            {customerEmail && (
              <p className="text-xs text-neutral-500">{customerEmail}</p>
            )}
            {customerCountry && (
              <p className="text-xs text-neutral-400">{customerCountry}</p>
            )}
          </div>
          <div className="text-right">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              From
            </p>
            <p className="text-sm font-semibold text-neutral-800">
              {settings.businessName || "Your Business"}
            </p>
            {settings.businessAddress && (
              <p className="text-xs text-neutral-500">{settings.businessAddress}</p>
            )}
            {(settings.businessCity || settings.businessCountry) && (
              <p className="text-xs text-neutral-500">
                {[settings.businessCity, settings.businessCountry].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* LINE ITEMS TABLE                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="px-8 py-5">
          {/* Table header */}
          <div className="mb-2 grid grid-cols-12 gap-2 border-b border-neutral-100 pb-2">
            <p className="col-span-6 text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
              Description
            </p>
            <p className="col-span-2 text-right text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
              Qty
            </p>
            <p className="col-span-2 text-right text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
              Price
            </p>
            <p className="col-span-2 text-right text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
              Total
            </p>
          </div>

          {/* Rows */}
          <div className="space-y-0">
            <AnimatePresence initial={false}>
              {hasItems ? (
                lineItems.map((item, i) => {
                  const rowTotal =
                    (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0);
                  const hasContent =
                    item?.description || item?.quantity || item?.unitPrice;
                  if (!hasContent) return null;

                  return (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-12 gap-2 border-b border-neutral-50 py-2.5"
                    >
                      <p className="col-span-6 text-xs text-neutral-700 leading-relaxed pr-2">
                        {item?.description || (
                          <span className="italic text-neutral-300">Description…</span>
                        )}
                      </p>
                      <p className="col-span-2 text-right text-xs tabular-nums text-neutral-600">
                        {item?.quantity || 0}
                      </p>
                      <p className="col-span-2 text-right text-xs tabular-nums text-neutral-600">
                        {fmt(Number(item?.unitPrice) || 0, currency)}
                      </p>
                      <p className="col-span-2 text-right text-xs font-semibold tabular-nums text-neutral-800">
                        {fmt(rowTotal, currency)}
                      </p>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 text-center"
                >
                  <p className="text-xs text-neutral-300 italic">
                    Line items will appear here…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* TOTALS                                                            */}
          {/* ---------------------------------------------------------------- */}
          <div className="mt-4 ml-auto w-52 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(subtotalCents / 100, currency)}</span>
            </div>

            {taxRate > 0 && (
              <motion.div
                layout
                className="flex justify-between text-xs text-neutral-500"
              >
                <span>Tax ({taxRate.toFixed(2)}%)</span>
                <span className="tabular-nums">{fmt(taxAmountCents / 100, currency)}</span>
              </motion.div>
            )}

            <div className="h-px bg-neutral-200" />

            <div className="flex justify-between">
              <span className="text-sm font-bold text-neutral-800">Total Due</span>
              <motion.span
                key={totalCents}
                initial={{ opacity: 0.5, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="tabular-nums text-sm font-bold text-neutral-900"
              >
                {fmt(totalCents / 100, currency)}
              </motion.span>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* NOTES / FOOTER                                                     */}
        {/* ---------------------------------------------------------------- */}
        <AnimatePresence>
          {formValues.notes && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-neutral-100 bg-neutral-50 px-8 py-5 overflow-hidden"
            >
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Notes
              </p>
              <p className="text-xs leading-relaxed text-neutral-500 whitespace-pre-wrap">
                {formValues.notes}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer stripe */}
        <div className="bg-[#0A0A0A] px-8 py-3">
          <p className="text-center text-[9px] text-neutral-700 tracking-wider">
            Thank you for your business.
          </p>
        </div>
      </motion.div>

      {/* Bottom margin spacer */}
      <div className="h-8" />
    </div>
  );
}
