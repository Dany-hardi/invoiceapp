// =============================================================================
// app/(dashboard)/invoices/new/panels/customer-panel.tsx
// "use client" — Customer selector with debounced search + inline create.
// =============================================================================

"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  UserPlus,
  ChevronDown,
  Building2,
  X,
  Check,
} from "lucide-react";

import { searchCustomers } from "../actions";
import { FormField, FormInput } from "@/components/ui/form-primitives";
import { cn } from "@/lib/utils";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface CustomerPanelProps {
  initialCustomers: CustomerOption[];
}

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerPanel({ initialCustomers }: CustomerPanelProps) {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();

  const customerMode = watch("customerMode");
  const selectedCustomerId = watch("customerId");

  // Combobox state
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<CustomerOption[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 250);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search — uses indexed DB query via server action
  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedQuery.trim()) {
      setResults(initialCustomers.slice(0, 8));
      return;
    }
    startTransition(async () => {
      const found = await searchCustomers(debouncedQuery);
      setResults(found);
    });
  }, [debouncedQuery, isOpen, initialCustomers]);

  const handleSelect = useCallback(
    (customer: CustomerOption) => {
      setSelectedCustomer(customer);
      setValue("customerId", customer.id, { shouldValidate: true });
      setValue("customerMode", "existing");
      setQuery(customer.name);
      setIsOpen(false);
    },
    [setValue]
  );

  const handleClear = useCallback(() => {
    setSelectedCustomer(null);
    setValue("customerId", undefined);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [setValue]);

  return (
    <section>
      {/* Section title */}
      <div className="mb-3 flex items-center gap-2">
        <User className="h-3.5 w-3.5 text-neutral-600" strokeWidth={1.75} />
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Bill To
        </h3>
      </div>

      {/* Mode toggle */}
      <div className="mb-4 flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => {
            setValue("customerMode", "existing");
          }}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
            customerMode === "existing"
              ? "bg-white/[0.08] text-white"
              : "text-neutral-600 hover:text-neutral-400"
          )}
        >
          Select existing
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("customerMode", "new");
            setSelectedCustomer(null);
            setValue("customerId", undefined);
          }}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
            customerMode === "new"
              ? "bg-white/[0.08] text-white"
              : "text-neutral-600 hover:text-neutral-400"
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            <UserPlus className="h-3 w-3" strokeWidth={2} />
            New customer
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* EXISTING CUSTOMER — Searchable combobox                              */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence initial={false} mode="wait">
        {customerMode === "existing" && (
          <motion.div
            key="existing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative" ref={dropdownRef}>
              {/* Input */}
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600"
                  strokeWidth={1.75}
                />
                <input
                  ref={inputRef}
                  value={selectedCustomer ? selectedCustomer.name : query}
                  readOnly={!!selectedCustomer}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => !selectedCustomer && setIsOpen(true)}
                  placeholder="Search customers…"
                  className={cn(
                    "w-full rounded-lg border bg-white/[0.03] py-2.5 pl-9 pr-9",
                    "text-sm outline-none transition-all duration-150",
                    "placeholder:text-neutral-700",
                    selectedCustomer ? "text-white cursor-default" : "text-white",
                    errors.customerId
                      ? "border-red-500/40 focus:ring-2 focus:ring-red-500/10"
                      : "border-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10",
                    isOpen && !selectedCustomer && "border-blue-500/50 ring-2 ring-blue-500/10"
                  )}
                />

                {/* Right side: clear or chevron */}
                {selectedCustomer ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                ) : (
                  <ChevronDown
                    className={cn(
                      "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-700 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                    strokeWidth={2}
                  />
                )}
              </div>

              {/* Hidden RHF field */}
              <input type="hidden" {...register("customerId")} />

              {/* Validation error */}
              <AnimatePresence>
                {errors.customerId && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 text-xs text-red-400"
                  >
                    {errors.customerId.message}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Dropdown */}
              <AnimatePresence>
                {isOpen && !selectedCustomer && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "absolute top-full left-0 right-0 z-50 mt-1.5",
                      "rounded-xl border border-white/[0.08] bg-[#161616]",
                      "shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
                    )}
                  >
                    {isPending && (
                      <div className="flex items-center gap-2 px-4 py-3 text-xs text-neutral-600">
                        <div className="h-3 w-3 animate-spin rounded-full border border-neutral-700 border-t-neutral-500" />
                        Searching…
                      </div>
                    )}

                    {!isPending && results.length === 0 && (
                      <div className="px-4 py-4 text-center">
                        <p className="text-xs text-neutral-600">No customers found.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setValue("customerMode", "new");
                            setIsOpen(false);
                          }}
                          className="mt-2 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          Create new customer →
                        </button>
                      </div>
                    )}

                    {!isPending && results.length > 0 && (
                      <ul className="py-1 max-h-56 overflow-y-auto">
                        {results.map((customer) => (
                          <li key={customer.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(customer)}
                              className={cn(
                                "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                                "hover:bg-white/[0.04] transition-colors",
                                selectedCustomerId === customer.id && "bg-blue-500/5"
                              )}
                            >
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-semibold text-blue-400">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate text-xs font-medium text-white">
                                  {customer.name}
                                </p>
                                <p className="truncate text-[11px] text-neutral-600">
                                  {customer.company
                                    ? `${customer.company} · ${customer.email}`
                                    : customer.email}
                                </p>
                              </div>
                              {selectedCustomerId === customer.id && (
                                <Check className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" strokeWidth={2.5} />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected customer card */}
            <AnimatePresence>
              {selectedCustomer && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-white">
                        {selectedCustomer.name}
                      </p>
                      {selectedCustomer.company && (
                        <p className="text-xs text-neutral-500">{selectedCustomer.company}</p>
                      )}
                      <p className="text-xs text-neutral-600">{selectedCustomer.email}</p>
                    </div>
                    <div className="flex h-5 items-center justify-center rounded-full bg-green-500/10 px-2 text-[10px] font-medium text-green-400">
                      Selected
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* NEW CUSTOMER — Inline create form                                 */}
        {/* ---------------------------------------------------------------- */}
        {customerMode === "new" && (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
              <UserPlus className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" strokeWidth={1.75} />
              <p className="text-xs text-blue-300">
                This customer will be saved to your contacts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Full Name"
                htmlFor="newCustomer.name"
                error={errors.newCustomer?.name?.message}
                required
                className="col-span-2"
              >
                <FormInput
                  id="newCustomer.name"
                  placeholder="Jane Smith"
                  hasError={!!errors.newCustomer?.name}
                  {...register("newCustomer.name")}
                />
              </FormField>

              <FormField
                label="Email"
                htmlFor="newCustomer.email"
                error={errors.newCustomer?.email?.message}
                required
                className="col-span-2"
              >
                <FormInput
                  id="newCustomer.email"
                  type="email"
                  placeholder="jane@company.com"
                  hasError={!!errors.newCustomer?.email}
                  {...register("newCustomer.email")}
                />
              </FormField>

              <FormField
                label="Company"
                htmlFor="newCustomer.company"
                error={errors.newCustomer?.company?.message}
              >
                <FormInput
                  id="newCustomer.company"
                  placeholder="Acme Inc."
                  hasError={!!errors.newCustomer?.company}
                  {...register("newCustomer.company")}
                />
              </FormField>

              <FormField
                label="Country"
                htmlFor="newCustomer.country"
                error={errors.newCustomer?.country?.message}
              >
                <FormInput
                  id="newCustomer.country"
                  placeholder="United States"
                  hasError={!!errors.newCustomer?.country}
                  {...register("newCustomer.country")}
                />
              </FormField>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
