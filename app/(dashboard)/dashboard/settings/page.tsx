// =============================================================================
// app/(dashboard)/settings/page.tsx
// Server Component — fetches FreelancerSettings, passes to client form.
// Uses React Suspense for skeleton loading.
// =============================================================================

import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";
import { SettingsSkeleton } from "./settings-skeleton";

export const metadata: Metadata = {
  title: "Settings",
};

// ---------------------------------------------------------------------------
// Data fetcher (separate async function for clean Suspense boundary)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Data fetcher (separate async function for clean Suspense boundary)
// ---------------------------------------------------------------------------

async function SettingsContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const settings = await prisma.freelancerSettings.findUnique({
    where: { userId: session.user.id },
  });

  // Intercept the settings if they exist and convert the Decimal to a plain number
  const safeSettings = settings
    ? {
        ...settings,
        defaultTaxRate: settings.defaultTaxRate ? Number(settings.defaultTaxRate) : 0,
      }
    : {
        // Fallback defaults if no settings are found
        id: "",
        userId: session.user.id,
        businessName: "",
        businessEmail: session.user.email ?? "",
        businessPhone: "",
        businessAddress: "",
        businessCity: "",
        businessCountry: "",
        taxId: "",
        logoUrl: "",
        bankName: "",
        accountName: "",
        accountNumber: "",
        routingNumber: "",
        swiftCode: "",
        iban: "",
        defaultCurrency: "USD",
        defaultTaxRate: 0,
        defaultDueDays: 30,
        defaultNotes: "",
        invoicePrefix: "INV",
        stripePublishableKey: "",
        stripeSecretKeyHash: null,
        stripeWebhookSecret: null,
        resendApiKeyHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

  return <SettingsForm initialData={safeSettings} />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Configure your business profile, banking details, and API integrations.
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
