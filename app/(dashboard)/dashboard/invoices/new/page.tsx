// =============================================================================
// app/(dashboard)/invoices/new/page.tsx
// Server Component — prefetches customers + freelancer settings,
// passes as props to the client-side InvoiceBuilder.
// Zero client-side loading spinners for initial data.
// =============================================================================

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceBuilder } from "./invoice-builder";

export const metadata: Metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Parallel fetch — both queries run simultaneously
  const [customers, settings] = await Promise.all([
    prisma.customer.findMany({
      where:   { userId },
      select:  { id: true, name: true, email: true, company: true },
      orderBy: { name: "asc" },
      take:    100,
    }),
    prisma.freelancerSettings.findUnique({
      where:  { userId },
      select: {
        businessName:    true,
        businessEmail:   true,
        businessAddress: true,
        businessCity:    true,
        businessCountry: true,
        taxId:           true,
        logoUrl:         true,
        defaultCurrency: true,
        defaultTaxRate:  true,
        defaultDueDays:  true,
        defaultNotes:    true,
        invoicePrefix:   true,
      },
    }),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const dueDays = settings?.defaultDueDays ?? 30;
  const dueDate = new Date(Date.now() + dueDays * 86_400_000)
    .toISOString()
    .split("T")[0];

  return (
    <InvoiceBuilder
      initialCustomers={customers}
      settings={{
        businessName:    settings?.businessName    ?? "",
        businessEmail:   settings?.businessEmail   ?? "",
        businessAddress: settings?.businessAddress ?? "",
        businessCity:    settings?.businessCity    ?? "",
        businessCountry: settings?.businessCountry ?? "",
        taxId:           settings?.taxId           ?? "",
        logoUrl:         settings?.logoUrl         ?? "",
        defaultCurrency: settings?.defaultCurrency ?? "USD",
        defaultTaxRate:  Number(settings?.defaultTaxRate ?? 0),
        defaultNotes:    settings?.defaultNotes    ?? "",
        invoicePrefix:   settings?.invoicePrefix   ?? "INV",
      }}
      defaults={{ today, dueDate }}
    />
  );
}
