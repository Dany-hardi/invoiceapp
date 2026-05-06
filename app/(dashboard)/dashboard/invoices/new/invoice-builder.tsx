// =============================================================================
// app/(dashboard)/invoices/new/invoice-builder.tsx
// "use client" — Split-panel invoice builder shell.
// LEFT: form (RHF + Zod). RIGHT: live preview (useDeferredValue).
// =============================================================================

"use client";

// To this:
import { startTransition, useActionState, useDeferredValue, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

import { InvoiceFormSchema, type InvoiceFormValues } from "@/lib/schemas/invoice.schema";
import { createInvoice, type CreateInvoiceState } from "./actions";
import { CustomerPanel } from "./panels/customer-panel";
import { LineItemsPanel } from "./panels/line-items-panel";
import { InvoiceMetaPanel } from "./panels/invoice-meta-panel";
import { InvoicePreview } from "./preview/invoice-preview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface FreelancerSettings {
  businessName:    string;
  businessEmail:   string;
  businessAddress: string;
  businessCity:    string;
  businessCountry: string;
  taxId:           string;
  logoUrl:         string;
  defaultCurrency: string;
  defaultTaxRate:  number;
  defaultNotes:    string;
  invoicePrefix:   string;
}

interface InvoiceBuilderProps {
  initialCustomers: Customer[];
  settings: FreelancerSettings;
  defaults: { today: string; dueDate: string };
}

// ---------------------------------------------------------------------------
// Initial state for useActionState
// ---------------------------------------------------------------------------

const initialActionState: CreateInvoiceState = { status: "idle" };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceBuilder({
  initialCustomers,
  settings,
  defaults,
}: InvoiceBuilderProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [actionState, formAction, isPending] = useActionState(
    createInvoice,
    initialActionState
  );

  // -------------------------------------------------------------------------
  // RHF setup
  // -------------------------------------------------------------------------

  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceFormSchema),
    mode: "onBlur",
    defaultValues: {
      customerMode:  "existing",
      customerId:    undefined,
      newCustomer:   { name: "", email: "", company: "", address: "", country: "" },
      issueDate:     defaults.today,
      dueDate:       defaults.dueDate,
      taxRate:       settings.defaultTaxRate,
      currency:      settings.defaultCurrency,
      notes:         settings.defaultNotes,
      invoicePrefix: settings.invoicePrefix,
      lineItems: [
        { description: "", quantity: 1, unitPrice: 0 },
      ],
    },
  });

  // -------------------------------------------------------------------------
  // Live preview — deferred so form inputs are never blocked
  // useDeferredValue creates a low-priority copy of the watched data
  // -------------------------------------------------------------------------

  const watchedValues = methods.watch();
  const deferredValues = useDeferredValue(watchedValues);

  // -------------------------------------------------------------------------
  // Handle success redirect + server validation error sync
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (actionState.status === "success") {
      router.push(`/dashboard/invoices/${actionState.invoiceId}?created=true`);
    }
    if (actionState.status === "validation_error") {
      Object.entries(actionState.errors).forEach(([field, messages]) => {
        if (messages?.length) {
          methods.setError(field as keyof InvoiceFormValues, {
            message: messages[0],
          });
        }
      });
    }
  }, [actionState, methods, router]);

  // -------------------------------------------------------------------------
  // Submit — serialize form data as JSON payload
  // -------------------------------------------------------------------------

  const handleSubmit = methods.handleSubmit((data) => {
    const fd = new FormData();
    fd.set("payload", JSON.stringify(data));
    // Manually invoke the server action with FormData wrapped in a transition
    startTransition(() => {
      formAction(fd);
    });
  });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-112px)] gap-0 overflow-hidden -mx-6 md:-mx-8 lg:-mx-10">
      {/* ================================================================== */}
      {/* LEFT PANEL — Form                                                    */}
      {/* ================================================================== */}
      <FormProvider {...methods}>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex w-full max-w-[520px] flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.06]"
          noValidate
        >
          {/* Form header */}
          <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0D0D0D] px-5">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              New Invoice
            </h2>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
              Draft
            </span>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <CustomerPanel initialCustomers={initialCustomers} />
            <Divider />
            <InvoiceMetaPanel />
            <Divider />
            <LineItemsPanel currency={deferredValues.currency ?? settings.defaultCurrency} />
          </div>

          {/* Action footer */}
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0D0D0D] px-5 py-3">
            {/* Error / success banners */}
            <AnimatePresence>
              {actionState.status === "error" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" strokeWidth={1.75} />
                  {actionState.message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {/* Save as draft */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-neutral-400 hover:border-white/20 hover:text-white disabled:opacity-50 transition-all"
                >
                  Save Draft
                </button>

                {/* Send invoice */}
                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isPending ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Create Invoice
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>

      {/* ================================================================== */}
      {/* RIGHT PANEL — Live Preview                                           */}
      {/* ================================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#0D0D0D]">
        {/* Preview header */}
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
          <span className="text-xs font-medium text-neutral-500">
            Live Preview
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-neutral-600">
              Updates as you type
            </span>
          </div>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-y-auto p-6">
          <InvoicePreview
            formValues={deferredValues}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

function Divider() {
  return <div className="h-px w-full bg-white/[0.05]" />;
}
