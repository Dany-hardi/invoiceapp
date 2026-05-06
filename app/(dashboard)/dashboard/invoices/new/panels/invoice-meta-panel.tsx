// =============================================================================
// app/(dashboard)/invoices/new/panels/invoice-meta-panel.tsx
// "use client" — Issue date, due date, tax rate, currency, notes.
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, SlidersHorizontal } from "lucide-react";
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/form-primitives";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar"       },
  { value: "EUR", label: "EUR — Euro"             },
  { value: "GBP", label: "GBP — British Pound"   },
  { value: "CAD", label: "CAD — Canadian Dollar"  },
  { value: "AUD", label: "AUD — Australian Dollar"},
  { value: "JPY", label: "JPY — Japanese Yen"    },
  { value: "CHF", label: "CHF — Swiss Franc"      },
  { value: "XAF", label: "XAF — CFA Franc"       },
  { value: "NGN", label: "NGN — Nigerian Naira"  },
];

export function InvoiceMetaPanel() {
  const {
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();

  return (
    <section className="space-y-5">
      {/* ------------------------------------------------------------------ */}
      {/* Dates row                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Dates
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Issue Date"
            htmlFor="issueDate"
            error={errors.issueDate?.message}
            required
          >
            <FormInput
              id="issueDate"
              type="date"
              hasError={!!errors.issueDate}
              className="[color-scheme:dark]"
              {...register("issueDate")}
            />
          </FormField>

          <FormField
            label="Due Date"
            htmlFor="dueDate"
            error={errors.dueDate?.message}
            required
          >
            <FormInput
              id="dueDate"
              type="date"
              hasError={!!errors.dueDate}
              className="[color-scheme:dark]"
              {...register("dueDate")}
            />
          </FormField>
        </div>

        {/* Due date relative label */}
        <AnimatePresence>
          {!errors.dueDate && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-[11px] text-neutral-700"
            >
              Client has until the due date to complete payment.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tax & Currency                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Tax & Currency
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Tax Rate"
            htmlFor="taxRate"
            error={errors.taxRate?.message}
          >
            <FormInput
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0.00"
              suffix="%"
              hasError={!!errors.taxRate}
              className="tabular-nums"
              {...register("taxRate", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="Currency"
            htmlFor="currency"
            error={errors.currency?.message}
          >
            <FormSelect
              id="currency"
              options={CURRENCIES}
              hasError={!!errors.currency}
              {...register("currency")}
            />
          </FormField>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Notes                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <FormField
          label="Notes / Payment Instructions"
          htmlFor="notes"
          error={errors.notes?.message}
          hint="Displayed at the bottom of the invoice. Bank details, terms, thank-you note."
        >
          <FormTextarea
            id="notes"
            rows={3}
            placeholder="Payment due within 30 days. Bank transfer to IBAN GB29 NWBK … Thank you for your business."
            hasError={!!errors.notes}
            {...register("notes")}
          />
        </FormField>
      </div>
    </section>
  );
}
