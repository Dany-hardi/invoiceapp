// =============================================================================
// app/(dashboard)/invoices/new/panels/line-items-panel.tsx
// "use client" — Dynamic line items with useFieldArray.
// Real-time per-row and subtotal calculations. Drag-reorder ready.
// =============================================================================

"use client";

import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/form-primitives";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Single line item row
// ---------------------------------------------------------------------------

interface LineItemRowProps {
  index: number;
  currency: string;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function LineItemRow({ index, currency, onRemove, canRemove }: LineItemRowProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();

  // Watch only this row's values for instant total calculation
  const quantity  = useWatch({ control, name: `lineItems.${index}.quantity`  }) ?? 0;
  const unitPrice = useWatch({ control, name: `lineItems.${index}.unitPrice` }) ?? 0;
  const rowTotal  = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const rowErrors = errors.lineItems?.[index];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
    >
      {/* Drag handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-neutral-700" strokeWidth={1.5} />
      </div>

      {/* Row number badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-medium text-neutral-600">
          {index + 1}
        </span>
        <AnimatePresence>
          {canRemove && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onRemove(index)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-700 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
              aria-label="Remove line item"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-neutral-600">
          Description <span className="text-blue-500">*</span>
        </label>
        <FormInput
          placeholder="e.g. Website design — homepage"
          hasError={!!rowErrors?.description}
          {...register(`lineItems.${index}.description`)}
        />
        <AnimatePresence>
          {rowErrors?.description && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 text-[11px] text-red-400"
            >
              {rowErrors.description.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Qty · Price · Total */}
      <div className="grid grid-cols-3 gap-3">
        {/* Quantity */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-neutral-600">
            Qty
          </label>
          <FormInput
            type="number"
            min="0"
            step="any"
            placeholder="1"
            hasError={!!rowErrors?.quantity}
            className="text-right tabular-nums"
            {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
          />
          <AnimatePresence>
            {rowErrors?.quantity && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 text-[10px] text-red-400"
              >
                {rowErrors.quantity.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Unit price */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-neutral-600">
            Unit Price
          </label>
          <div className="relative">
            <FormInput
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              hasError={!!rowErrors?.unitPrice}
              className="text-right tabular-nums"
              {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
            />
          </div>
          <AnimatePresence>
            {rowErrors?.unitPrice && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 text-[10px] text-red-400"
              >
                {rowErrors.unitPrice.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Row total — computed, read-only */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-neutral-600">
            Total
          </label>
          <div
            className={cn(
              "flex h-10 items-center justify-end rounded-lg border border-white/[0.04]",
              "bg-white/[0.015] px-3 tabular-nums text-sm font-semibold",
              rowTotal > 0 ? "text-white" : "text-neutral-700"
            )}
          >
            {formatMoney(rowTotal, currency)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Line Items Panel
// ---------------------------------------------------------------------------

interface LineItemsPanelProps {
  currency: string;
}

export function LineItemsPanel({ currency }: LineItemsPanelProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  // Watch all line items for subtotal
  const lineItems = useWatch({ control, name: "lineItems" }) ?? [];
  const taxRate   = useWatch({ control, name: "taxRate" })   ?? 0;

  const subtotal     = lineItems.reduce(
    (sum: number, item: { quantity?: number; unitPrice?: number }) =>
      sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0),
    0
  );
  const taxAmount    = subtotal * (Number(taxRate) / 100);
  const grandTotal   = subtotal + taxAmount;

  return (
    <section>
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Line Items
          </h3>
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/[0.06] px-1 text-[10px] font-medium text-neutral-500">
            {fields.length}
          </span>
        </div>
      </div>

      {/* Root-level error (e.g. "Add at least one line item") */}
      <AnimatePresence>
        {errors.lineItems?.root && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 text-xs text-red-400"
          >
            {errors.lineItems.root.message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Items list */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {fields.map((field, index) => (
            <LineItemRow
              key={field.id}
              index={index}
              currency={currency}
              onRemove={remove}
              canRemove={fields.length > 1}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add item button */}
      <motion.button
        type="button"
        onClick={() =>
          append({ description: "", quantity: 1, unitPrice: 0 })
        }
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2",
          "rounded-xl border border-dashed border-white/[0.08]",
          "py-3 text-xs font-medium text-neutral-600",
          "hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5",
          "transition-all duration-150"
        )}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Add line item
      </motion.button>

      {/* ------------------------------------------------------------------ */}
      {/* Totals summary                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-5 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Subtotal</span>
          <span className="tabular-nums font-medium text-neutral-300">
            {formatMoney(subtotal, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            Tax{" "}
            <span className="text-neutral-700">
              ({Number(taxRate).toFixed(2)}%)
            </span>
          </span>
          <span className="tabular-nums font-medium text-neutral-300">
            {formatMoney(taxAmount, currency)}
          </span>
        </div>

        <div className="h-px bg-white/[0.06]" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Total</span>
          <motion.span
            key={grandTotal.toFixed(2)}
            initial={{ opacity: 0.6, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="tabular-nums text-base font-bold text-white"
          >
            {formatMoney(grandTotal, currency)}
          </motion.span>
        </div>
      </div>
    </section>
  );
}
