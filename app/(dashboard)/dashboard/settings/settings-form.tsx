// =============================================================================
// app/(dashboard)/settings/settings-form.tsx
// "use client" — Full settings form.
// Sections: Business Identity, Invoice Defaults, Banking, API Keys.
// React Hook Form + Zod (client) + Server Action (server Zod re-validation).
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CreditCard,
  FileDigit,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { FreelancerSettings } from "@prisma/client";

import { saveSettings, type SettingsActionState } from "./actions";
import { SettingsSchema, type SettingsFormValues } from "@/lib/schemas/settings.schema";
import {
  SectionCard,
  FieldGrid,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  ApiKeyInput,
  SaveButton,
} from "@/components/ui/form-primitives";

// ---------------------------------------------------------------------------
// Currency options
// ---------------------------------------------------------------------------

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "XAF", label: "XAF — CFA Franc" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type SettingsData = Pick<
  FreelancerSettings,
  | "businessName" | "businessEmail" | "businessPhone"
  | "businessAddress" | "businessCity" | "businessCountry"
  | "taxId" | "logoUrl" | "invoicePrefix" | "defaultCurrency"
  | "defaultTaxRate" | "defaultDueDays" | "defaultNotes"
  | "bankName" | "accountName" | "accountNumber"
  | "routingNumber" | "swiftCode" | "iban"
  | "stripePublishableKey" | "stripeSecretKeyHash"
  | "stripeWebhookSecret" | "resendApiKeyHash"
>;

interface SettingsFormProps {
  initialData: SettingsData;
}

const initialState: SettingsActionState = { status: "idle" };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [actionState, formAction, isPending] = useActionState(
    saveSettings,
    initialState
  );

  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    formState: { errors },
    setError,
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsSchema),
    mode: "onBlur",
    defaultValues: {
      businessName:    initialData.businessName    ?? "",
      businessEmail:   initialData.businessEmail   ?? "",
      businessPhone:   initialData.businessPhone   ?? "",
      businessAddress: initialData.businessAddress ?? "",
      businessCity:    initialData.businessCity    ?? "",
      businessCountry: initialData.businessCountry ?? "",
      taxId:           initialData.taxId           ?? "",
      logoUrl:         initialData.logoUrl         ?? "",
      invoicePrefix:   initialData.invoicePrefix   ?? "INV",
      defaultCurrency: initialData.defaultCurrency ?? "USD",
      defaultTaxRate:  Number(initialData.defaultTaxRate ?? 0),
      defaultDueDays:  initialData.defaultDueDays  ?? 30,
      defaultNotes:    initialData.defaultNotes    ?? "",
      bankName:        initialData.bankName        ?? "",
      accountName:     initialData.accountName     ?? "",
      accountNumber:   initialData.accountNumber   ?? "",
      routingNumber:   initialData.routingNumber   ?? "",
      swiftCode:       initialData.swiftCode       ?? "",
      iban:            initialData.iban            ?? "",
      stripePublishableKey: initialData.stripePublishableKey ?? "",
      stripeSecretKey:      "",
      stripeWebhookSecret:  "",
      resendApiKey:         "",
    },
  });

  // Sync server validation errors → RHF fields
  useEffect(() => {
    if (actionState.status === "validation_error") {
      Object.entries(actionState.errors).forEach(([field, messages]) => {
        if (messages?.length) {
          setError(field as keyof SettingsFormValues, {
            message: messages[0],
          });
        }
      });
    }
  }, [actionState, setError]);

  // Auto-reset "success" button after 3 seconds
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (actionState.status === "success") {
      successTimerRef.current = setTimeout(() => {
        reset(undefined, { keepValues: true });
      }, 3000);
    }
    return () => clearTimeout(successTimerRef.current);
  }, [actionState.status, reset]);

  // Derive button state
  const buttonState = isPending
    ? "pending"
    : actionState.status === "success"
    ? "success"
    : actionState.status === "error"
    ? "error"
    : "idle";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {/* ------------------------------------------------------------------ */}
      {/* Global success / error toast                                         */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {(actionState.status === "success" || actionState.status === "error") && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                actionState.status === "success"
                  ? "border-green-500/20 bg-green-500/5 text-green-300"
                  : "border-red-500/20 bg-red-500/5 text-red-300"
              }`}
            >
              {actionState.status === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" strokeWidth={1.75} />
              ) : (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" strokeWidth={1.75} />
              )}
              {actionState.status === "success"
                ? actionState.message
                : actionState.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* SECTION 1 — Business Identity                                        */}
      {/* ================================================================== */}
      <SectionCard
        title="Business Identity"
        description="How you appear on invoices and emails."
        icon={Building2}
      >
        <FieldGrid>
          <FormField label="Business Name" htmlFor="businessName" error={errors.businessName?.message} required>
            <FormInput
              id="businessName"
              placeholder="Acme Studio"
              hasError={!!errors.businessName}
              {...register("businessName")}
            />
          </FormField>

          <FormField label="Business Email" htmlFor="businessEmail" error={errors.businessEmail?.message} required>
            <FormInput
              id="businessEmail"
              type="email"
              placeholder="billing@acme.io"
              hasError={!!errors.businessEmail}
              {...register("businessEmail")}
            />
          </FormField>

          <FormField label="Phone" htmlFor="businessPhone" error={errors.businessPhone?.message}>
            <FormInput
              id="businessPhone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              hasError={!!errors.businessPhone}
              {...register("businessPhone")}
            />
          </FormField>

          <FormField label="Tax ID / VAT / EIN" htmlFor="taxId" error={errors.taxId?.message}>
            <FormInput
              id="taxId"
              placeholder="US123456789"
              hasError={!!errors.taxId}
              {...register("taxId")}
            />
          </FormField>

          <FormField label="Address" htmlFor="businessAddress" error={errors.businessAddress?.message} className="sm:col-span-2">
            <FormInput
              id="businessAddress"
              placeholder="123 Main Street, Suite 4"
              hasError={!!errors.businessAddress}
              {...register("businessAddress")}
            />
          </FormField>

          <FormField label="City" htmlFor="businessCity" error={errors.businessCity?.message}>
            <FormInput
              id="businessCity"
              placeholder="San Francisco"
              hasError={!!errors.businessCity}
              {...register("businessCity")}
            />
          </FormField>

          <FormField label="Country" htmlFor="businessCountry" error={errors.businessCountry?.message}>
            <FormInput
              id="businessCountry"
              placeholder="United States"
              hasError={!!errors.businessCountry}
              {...register("businessCountry")}
            />
          </FormField>

          <FormField
            label="Logo URL"
            htmlFor="logoUrl"
            error={errors.logoUrl?.message}
            hint="Paste a direct image link (PNG or SVG recommended)."
            className="sm:col-span-2"
          >
            <FormInput
              id="logoUrl"
              type="url"
              placeholder="https://cdn.example.com/logo.png"
              hasError={!!errors.logoUrl}
              {...register("logoUrl")}
            />
          </FormField>
        </FieldGrid>
      </SectionCard>

      {/* ================================================================== */}
      {/* SECTION 2 — Invoice Defaults                                         */}
      {/* ================================================================== */}
      <SectionCard
        title="Invoice Defaults"
        description="Applied automatically to every new invoice."
        icon={FileDigit}
      >
        <FieldGrid>
          <FormField
            label="Invoice Prefix"
            htmlFor="invoicePrefix"
            error={errors.invoicePrefix?.message}
            hint='e.g. "DEV" → DEV-483920174'
          >
            <FormInput
              id="invoicePrefix"
              placeholder="INV"
              maxLength={6}
              hasError={!!errors.invoicePrefix}
              className="uppercase"
              {...register("invoicePrefix")}
            />
          </FormField>

          <FormField label="Currency" htmlFor="defaultCurrency" error={errors.defaultCurrency?.message}>
            <FormSelect
              id="defaultCurrency"
              options={CURRENCIES}
              hasError={!!errors.defaultCurrency}
              {...register("defaultCurrency")}
            />
          </FormField>

          <FormField
            label="Default Tax Rate"
            htmlFor="defaultTaxRate"
            error={errors.defaultTaxRate?.message}
            hint="Applied to line item totals."
          >
            <FormInput
              id="defaultTaxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              suffix="%"
              hasError={!!errors.defaultTaxRate}
              {...register("defaultTaxRate", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="Default Due Days"
            htmlFor="defaultDueDays"
            error={errors.defaultDueDays?.message}
            hint="e.g. 30 = Net-30 payment terms."
          >
            <FormInput
              id="defaultDueDays"
              type="number"
              min="1"
              max="365"
              placeholder="30"
              suffix="days"
              hasError={!!errors.defaultDueDays}
              {...register("defaultDueDays", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="Default Invoice Notes"
            htmlFor="defaultNotes"
            error={errors.defaultNotes?.message}
            className="sm:col-span-2"
          >
            <FormTextarea
              id="defaultNotes"
              placeholder="Payment due within 30 days. Bank transfer preferred. Thank you for your business."
              rows={3}
              hasError={!!errors.defaultNotes}
              {...register("defaultNotes")}
            />
          </FormField>
        </FieldGrid>
      </SectionCard>

      {/* ================================================================== */}
      {/* SECTION 3 — Banking Details                                          */}
      {/* ================================================================== */}
      <SectionCard
        title="Banking Details"
        description="Printed on invoices for bank transfer payments."
        icon={CreditCard}
      >
        <FieldGrid>
          <FormField label="Bank Name" htmlFor="bankName" error={errors.bankName?.message}>
            <FormInput
              id="bankName"
              placeholder="Chase Bank"
              hasError={!!errors.bankName}
              {...register("bankName")}
            />
          </FormField>

          <FormField label="Account Name" htmlFor="accountName" error={errors.accountName?.message}>
            <FormInput
              id="accountName"
              placeholder="Acme Studio LLC"
              hasError={!!errors.accountName}
              {...register("accountName")}
            />
          </FormField>

          <FormField label="Account Number" htmlFor="accountNumber" error={errors.accountNumber?.message}>
            <FormInput
              id="accountNumber"
              placeholder="000123456789"
              autoComplete="off"
              hasError={!!errors.accountNumber}
              {...register("accountNumber")}
            />
          </FormField>

          <FormField
            label="Routing / Sort Code"
            htmlFor="routingNumber"
            error={errors.routingNumber?.message}
          >
            <FormInput
              id="routingNumber"
              placeholder="021000021"
              autoComplete="off"
              hasError={!!errors.routingNumber}
              {...register("routingNumber")}
            />
          </FormField>

          <FormField
            label="SWIFT / BIC"
            htmlFor="swiftCode"
            error={errors.swiftCode?.message}
            hint="8 or 11 characters. Required for international transfers."
          >
            <FormInput
              id="swiftCode"
              placeholder="CHASUS33"
              maxLength={11}
              className="uppercase"
              hasError={!!errors.swiftCode}
              {...register("swiftCode")}
            />
          </FormField>

          <FormField
            label="IBAN"
            htmlFor="iban"
            error={errors.iban?.message}
            hint="Required for SEPA transfers."
          >
            <FormInput
              id="iban"
              placeholder="GB29NWBK60161331926819"
              className="uppercase"
              hasError={!!errors.iban}
              {...register("iban")}
            />
          </FormField>
        </FieldGrid>
      </SectionCard>

      {/* ================================================================== */}
      {/* SECTION 4 — API Keys                                                 */}
      {/* ================================================================== */}
      <SectionCard
        title="API Integrations"
        description="Keys are hashed before storage and never returned in plaintext."
        icon={KeyRound}
      >
        <FieldGrid cols={1}>
          <FormField
            label="Stripe Publishable Key"
            htmlFor="stripePublishableKey"
            error={errors.stripePublishableKey?.message}
          >
            <ApiKeyInput
              id="stripePublishableKey"
              label="Stripe publishable key"
              isSet={false}
              hasError={!!errors.stripePublishableKey}
              placeholder="pk_live_…"
              {...register("stripePublishableKey")}
            />
          </FormField>

          <FormField
            label="Stripe Secret Key"
            htmlFor="stripeSecretKey"
            error={errors.stripeSecretKey?.message}
          >
            <ApiKeyInput
              id="stripeSecretKey"
              label="Stripe secret key"
              isSet={!!initialData.stripeSecretKeyHash}
              hasError={!!errors.stripeSecretKey}
              {...register("stripeSecretKey")}
            />
          </FormField>

          <FormField
            label="Stripe Webhook Secret"
            htmlFor="stripeWebhookSecret"
            error={errors.stripeWebhookSecret?.message}
          >
            <ApiKeyInput
              id="stripeWebhookSecret"
              label="Stripe webhook secret"
              isSet={!!initialData.stripeWebhookSecret}
              hasError={!!errors.stripeWebhookSecret}
              {...register("stripeWebhookSecret")}
            />
          </FormField>

          <FormField
            label="Resend API Key"
            htmlFor="resendApiKey"
            error={errors.resendApiKey?.message}
            hint="Used to send invoice emails and magic links."
          >
            <ApiKeyInput
              id="resendApiKey"
              label="Resend API key"
              isSet={!!initialData.resendApiKeyHash}
              hasError={!!errors.resendApiKey}
              {...register("resendApiKey")}
            />
          </FormField>
        </FieldGrid>
      </SectionCard>

      {/* ================================================================== */}
      {/* Footer — save action                                                 */}
      {/* ================================================================== */}
      <div className="flex items-center justify-end gap-4 pt-2 pb-6">
        <p className="text-xs text-neutral-700">
          Changes take effect immediately.
        </p>
        <SaveButton state={buttonState} />
      </div>
    </form>
  );
}
