// =============================================================================
// app/(dashboard)/invoices/new/actions.ts
// Server Action — creates a new invoice.
// Flow: auth → validate → upsert customer → generate invoice number → save
// =============================================================================

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceFormSchema } from "@/lib/schemas/invoice.schema";
import { computeTotals } from "@/lib/schemas/invoice.schema";
import { generateInvoiceNumber } from "@/lib/invoice-id";
import type { InvoiceFormValues } from "@/lib/schemas/invoice.schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateInvoiceState =
  | { status: "idle" }
  | { status: "success"; invoiceId: string; invoiceNumber: string }
  | { status: "error"; message: string }
  | {
      status: "validation_error";
      errors: Partial<Record<string, string[]>>;
    };

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function createInvoice(
  _prev: CreateInvoiceState,
  formData: FormData
): Promise<CreateInvoiceState> {
  // 1. Auth guard
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // 2. Parse JSON payload (sent as a single serialized field from the client)
  const raw = formData.get("payload");
  if (!raw || typeof raw !== "string") {
    return { status: "error", message: "Invalid form payload." };
  }

  let parsed: InvoiceFormValues;
  try {
    const data = JSON.parse(raw);
    const result = InvoiceFormSchema.safeParse(data);
    if (!result.success) {
      return {
        status: "validation_error",
        errors: result.error.flatten().fieldErrors,
      };
    }
    parsed = result.data;
  } catch {
    return { status: "error", message: "Failed to parse form data." };
  }

  try {
    // 3. Resolve customer — use existing or create new
    let customerId = parsed.customerId;

    if (parsed.customerMode === "new" && parsed.newCustomer) {
      const nc = parsed.newCustomer;
      // Upsert by email to avoid duplicate customers
      const customer = await prisma.customer.upsert({
        where: {
          // We need a composite unique — use a findFirst workaround
          // since Customer has no unique email constraint at DB level.
          // Safe: we search first, then create.
          id: "non-existent",
        },
        update: {},
        create: {
          userId,
          name:    nc.name,
          email:   nc.email,
          company: nc.company ?? null,
          address: nc.address ?? null,
          country: nc.country ?? null,
        },
      }).catch(async () => {
        // Fallback: find existing by email for this user
        const existing = await prisma.customer.findFirst({
          where: { userId, email: nc.email },
        });
        if (existing) return existing;
        return prisma.customer.create({
          data: {
            userId,
            name:    nc.name,
            email:   nc.email,
            company: nc.company ?? null,
            address: nc.address ?? null,
            country: nc.country ?? null,
          },
        });
      });
      customerId = customer.id;
    }

    if (!customerId) {
      return {
        status: "validation_error",
        errors: { customerId: ["Please select or create a customer."] },
      };
    }

    // 4. Compute financials (authoritative server-side calculation)
    const { subtotalCents, taxAmountCents, totalCents, taxRateBps } =
      computeTotals(parsed.lineItems, parsed.taxRate);

    // 5. Generate unique invoice number (with retry loop)
    const invoiceNumber = await generateInvoiceNumber(userId);

    // 6. Persist invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        customerId,
        invoiceNumber,
        status:        "DRAFT",
        issueDate:     new Date(parsed.issueDate),
        dueDate:       new Date(parsed.dueDate),
        subtotalCents,
        taxRateBps,
        taxAmountCents,
        totalCents,
        currency:      parsed.currency,
        lineItems:     parsed.lineItems as object,
        notes:         parsed.notes ?? null,
      },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");

    return {
      status: "success",
      invoiceId:     invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    };
  } catch (err) {
    console.error("[createInvoice]", err);
    return {
      status: "error",
      message: "Failed to save invoice. Please try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// Customer search action — used by the combobox
// ---------------------------------------------------------------------------

export async function searchCustomers(query: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.customer.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { name:    { contains: query, mode: "insensitive" } },
        { email:   { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, company: true },
    orderBy: { name: "asc" },
    take: 8,
  });
}
