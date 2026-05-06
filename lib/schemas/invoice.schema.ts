// =============================================================================
// lib/schemas/invoice.schema.ts
// Zod schema for invoice creation and editing.
// Mirrors the Prisma Invoice model — validated on client (RHF) and server.
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Line Item
// ---------------------------------------------------------------------------

export const LineItemSchema = z.object({
  id: z.string().optional(), // client-side RHF id
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(200, "Description must be under 200 characters."),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number." })
    .positive("Quantity must be greater than 0.")
    .max(99_999, "Quantity is too large."),
  unitPrice: z
    .number({ invalid_type_error: "Unit price must be a number." })
    .min(0, "Price cannot be negative.")
    .max(999_999_99, "Price is too large."),
  // Computed — included so RHF can display it; not submitted to DB directly
  total: z.number().optional(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

// ---------------------------------------------------------------------------
// Invoice Form Values (what RHF works with)
// ---------------------------------------------------------------------------

export const InvoiceFormSchema = z
  .object({
    // Customer — either pick existing or create inline
    customerId: z.string().optional(),
    newCustomer: z
      .object({
        name: z
          .string()
          .trim()
          .min(1, "Customer name is required.")
          .max(100),
        email: z
          .string()
          .trim()
          .min(1, "Customer email is required.")
          .email("Invalid email address."),
        company: z.string().trim().optional(),
        address: z.string().trim().optional(),
        country: z.string().trim().optional(),
      })
      .optional(),

    // Must have either existing customer or new customer data
    customerMode: z.enum(["existing", "new"]),

    // Dates
    issueDate: z
      .string()
      .min(1, "Issue date is required.")
      .refine((v) => !isNaN(Date.parse(v)), "Invalid issue date."),
    dueDate: z
      .string()
      .min(1, "Due date is required.")
      .refine((v) => !isNaN(Date.parse(v)), "Invalid due date."),

    // Line items — at least one required
    lineItems: z
      .array(LineItemSchema)
      .min(1, "Add at least one line item.")
      .max(50, "Maximum 50 line items per invoice."),

    // Tax — stored as basis points on DB; user enters 0–100
    taxRate: z
      .number({ invalid_type_error: "Tax rate must be a number." })
      .min(0, "Tax rate cannot be negative.")
      .max(100, "Tax rate cannot exceed 100%."),

    currency: z
      .string()
      .length(3, "Currency must be 3 characters.")
      .toUpperCase(),

    notes: z.string().trim().max(1000, "Notes too long.").optional(),

    // Invoice prefix — from FreelancerSettings, used for ID generation
    invoicePrefix: z.string().min(2).max(6).toUpperCase(),
  })
  .superRefine((data, ctx) => {
    // Customer validation
    if (data.customerMode === "existing" && !data.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a customer.",
        path: ["customerId"],
      });
    }
    if (data.customerMode === "new") {
      if (!data.newCustomer?.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Customer name is required.",
          path: ["newCustomer", "name"],
        });
      }
      if (!data.newCustomer?.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Customer email is required.",
          path: ["newCustomer", "email"],
        });
      }
    }

    // Due date must be on or after issue date
    const issue = new Date(data.issueDate);
    const due = new Date(data.dueDate);
    if (!isNaN(issue.getTime()) && !isNaN(due.getTime()) && due < issue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date must be on or after the issue date.",
        path: ["dueDate"],
      });
    }
  });

export type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;

// ---------------------------------------------------------------------------
// Computed totals helper (used in both form and preview)
// ---------------------------------------------------------------------------

export interface InvoiceTotals {
  subtotalCents: number;
  taxAmountCents: number;
  totalCents: number;
  taxRateBps: number;
}

export function computeTotals(
  lineItems: { quantity: number; unitPrice: number }[],
  taxRate: number // 0–100
): InvoiceTotals {
  // Accumulate in cents to avoid float drift
  const subtotalCents = lineItems.reduce((sum, item) => {
    return sum + Math.round((item.quantity ?? 0) * (item.unitPrice ?? 0) * 100);
  }, 0);

  const taxRateBps = Math.round(taxRate * 100); // percent → bps
  const taxAmountCents = Math.round((subtotalCents * taxRateBps) / 10_000);
  const totalCents = subtotalCents + taxAmountCents;

  return { subtotalCents, taxAmountCents, totalCents, taxRateBps };
}
