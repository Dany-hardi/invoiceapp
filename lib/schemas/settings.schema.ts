// =============================================================================
// lib/schemas/settings.schema.ts
// Zod schema for FreelancerSettings — used by both client (RHF) and server action.
// Every rule is documented so error messages are meaningful to the user.
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const optionalString = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional();

// IBAN: 15–34 alphanumeric, uppercase, optional spaces between groups
const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;

// SWIFT/BIC: exactly 8 or 11 chars (ISO 9362)
const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const SettingsSchema = z.object({
  // --- Business Identity ---------------------------------------------------
  businessName: z
    .string()
    .trim()
    .min(1, "Business name is required.")
    .max(100, "Business name must be under 100 characters."),

  businessEmail: z
    .string()
    .trim()
    .min(1, "Business email is required.")
    .email("Please enter a valid email address."),

  businessPhone: optionalString,

  businessAddress: optionalString,

  businessCity: optionalString,

  businessCountry: optionalString,

  taxId: optionalString,

  logoUrl: z
    .string()
    .trim()
    .url("Logo URL must be a valid URL (e.g. https://...).")
    .optional()
    .or(z.literal("")),

  // --- Invoice Defaults ----------------------------------------------------
  invoicePrefix: z
    .string()
    .trim()
    .min(2, "Prefix must be at least 2 characters.")
    .max(6, "Prefix must be 6 characters or fewer.")
    .regex(/^[A-Z0-9]+$/i, "Prefix can only contain letters and numbers.")
    .transform((v) => v.toUpperCase()),

  defaultCurrency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code (e.g. USD, EUR).")
    .toUpperCase(),

  defaultTaxRate: z
    .number({ invalid_type_error: "Tax rate must be a number." })
    .min(0, "Tax rate cannot be negative.")
    .max(100, "Tax rate cannot exceed 100%."),

  defaultDueDays: z
    .number({ invalid_type_error: "Due days must be a number." })
    .int("Due days must be a whole number.")
    .min(1, "Due days must be at least 1.")
    .max(365, "Due days cannot exceed 365."),

  defaultNotes: optionalString,

  // --- Banking Details -----------------------------------------------------
  bankName: optionalString,

  accountName: optionalString,

  accountNumber: z
    .string()
    .trim()
    .max(34, "Account number is too long.")
    .optional()
    .or(z.literal("")),

  routingNumber: z
    .string()
    .trim()
    .max(20, "Routing number is too long.")
    .optional()
    .or(z.literal("")),

  swiftCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (v) => !v || swiftRegex.test(v),
      "SWIFT/BIC must be 8 or 11 alphanumeric characters (e.g. DEUTDEDB or DEUTDEDBXXX)."
    )
    .optional()
    .or(z.literal("")),

  iban: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, "")) // strip whitespace
    .refine(
      (v) => !v || ibanRegex.test(v),
      "IBAN must start with a 2-letter country code followed by digits and characters (e.g. GB29NWBK60161331926819)."
    )
    .optional()
    .or(z.literal("")),

  // --- API Keys (write-only — never returned from DB) ----------------------
  stripePublishableKey: z
    .string()
    .trim()
    .refine(
      (v) => !v || v.startsWith("pk_"),
      "Stripe publishable key must start with 'pk_'."
    )
    .optional()
    .or(z.literal("")),

  stripeSecretKey: z
    .string()
    .trim()
    .refine(
      (v) => !v || v.startsWith("sk_"),
      "Stripe secret key must start with 'sk_'."
    )
    .optional()
    .or(z.literal("")),

  stripeWebhookSecret: z
    .string()
    .trim()
    .refine(
      (v) => !v || v.startsWith("whsec_"),
      "Stripe webhook secret must start with 'whsec_'."
    )
    .optional()
    .or(z.literal("")),

  resendApiKey: z
    .string()
    .trim()
    .refine(
      (v) => !v || v.startsWith("re_"),
      "Resend API key must start with 're_'."
    )
    .optional()
    .or(z.literal("")),
});

export type SettingsFormValues = z.infer<typeof SettingsSchema>;
