// =============================================================================
// app/(dashboard)/settings/actions.ts
// Server Action — upserts FreelancerSettings for the authenticated user.
// Validates via Zod, hashes sensitive API keys, never stores raw secrets.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsSchema } from "@/lib/schemas/settings.schema";
import type { SettingsFormValues } from "@/lib/schemas/settings.schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SettingsActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | { status: "validation_error"; errors: Partial<Record<keyof SettingsFormValues, string[]>> };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * One-way SHA-256 hash for API keys.
 * We store only the hash — the raw key is never written to the DB.
 * On the UI, if a field is empty on submit, we leave the existing hash intact.
 */
function hashSecret(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function saveSettings(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  // 1. Auth guard
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  // 2. Parse raw form values
  const raw = {
    businessName:         formData.get("businessName"),
    businessEmail:        formData.get("businessEmail"),
    businessPhone:        formData.get("businessPhone"),
    businessAddress:      formData.get("businessAddress"),
    businessCity:         formData.get("businessCity"),
    businessCountry:      formData.get("businessCountry"),
    taxId:                formData.get("taxId"),
    logoUrl:              formData.get("logoUrl"),
    invoicePrefix:        formData.get("invoicePrefix"),
    defaultCurrency:      formData.get("defaultCurrency"),
    defaultTaxRate:       Number(formData.get("defaultTaxRate") ?? 0),
    defaultDueDays:       Number(formData.get("defaultDueDays") ?? 30),
    defaultNotes:         formData.get("defaultNotes"),
    bankName:             formData.get("bankName"),
    accountName:          formData.get("accountName"),
    accountNumber:        formData.get("accountNumber"),
    routingNumber:        formData.get("routingNumber"),
    swiftCode:            formData.get("swiftCode"),
    iban:                 formData.get("iban"),
    stripePublishableKey: formData.get("stripePublishableKey"),
    stripeSecretKey:      formData.get("stripeSecretKey"),
    stripeWebhookSecret:  formData.get("stripeWebhookSecret"),
    resendApiKey:         formData.get("resendApiKey"),
  };

  // 3. Validate
  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "validation_error",
      errors: parsed.error.flatten().fieldErrors as Partial<
        Record<keyof SettingsFormValues, string[]>
      >,
    };
  }

  const data = parsed.data;

  // 4. Fetch existing record to preserve existing key hashes
  const existing = await prisma.freelancerSettings.findUnique({
    where: { userId },
    select: {
      stripeSecretKeyHash: true,
      stripeWebhookSecret: true,
      resendApiKeyHash:    true,
    },
  });

  // 5. Build upsert payload
  //    API keys: only update hash if a new value was submitted
  const stripeSecretKeyHash = data.stripeSecretKey
    ? hashSecret(data.stripeSecretKey)
    : (existing?.stripeSecretKeyHash ?? null);

  const stripeWebhookSecret = data.stripeWebhookSecret
    ? hashSecret(data.stripeWebhookSecret)
    : (existing?.stripeWebhookSecret ?? null);

  const resendApiKeyHash = data.resendApiKey
    ? hashSecret(data.resendApiKey)
    : (existing?.resendApiKeyHash ?? null);

  try {
    await prisma.freelancerSettings.upsert({
      where:  { userId },
      create: {
        userId,
        businessName:         data.businessName,
        businessEmail:        data.businessEmail,
        businessPhone:        data.businessPhone ?? null,
        businessAddress:      data.businessAddress ?? null,
        businessCity:         data.businessCity ?? null,
        businessCountry:      data.businessCountry ?? null,
        taxId:                data.taxId ?? null,
        logoUrl:              data.logoUrl || null,
        invoicePrefix:        data.invoicePrefix,
        defaultCurrency:      data.defaultCurrency,
        defaultTaxRate:       data.defaultTaxRate,
        defaultDueDays:       data.defaultDueDays,
        defaultNotes:         data.defaultNotes ?? null,
        bankName:             data.bankName ?? null,
        accountName:          data.accountName ?? null,
        accountNumber:        data.accountNumber || null,
        routingNumber:        data.routingNumber || null,
        swiftCode:            data.swiftCode || null,
        iban:                 data.iban || null,
        stripePublishableKey: data.stripePublishableKey || null,
        stripeSecretKeyHash,
        stripeWebhookSecret,
        resendApiKeyHash,
      },
      update: {
        businessName:         data.businessName,
        businessEmail:        data.businessEmail,
        businessPhone:        data.businessPhone ?? null,
        businessAddress:      data.businessAddress ?? null,
        businessCity:         data.businessCity ?? null,
        businessCountry:      data.businessCountry ?? null,
        taxId:                data.taxId ?? null,
        logoUrl:              data.logoUrl || null,
        invoicePrefix:        data.invoicePrefix,
        defaultCurrency:      data.defaultCurrency,
        defaultTaxRate:       data.defaultTaxRate,
        defaultDueDays:       data.defaultDueDays,
        defaultNotes:         data.defaultNotes ?? null,
        bankName:             data.bankName ?? null,
        accountName:          data.accountName ?? null,
        accountNumber:        data.accountNumber || null,
        routingNumber:        data.routingNumber || null,
        swiftCode:            data.swiftCode || null,
        iban:                 data.iban || null,
        stripePublishableKey: data.stripePublishableKey || null,
        stripeSecretKeyHash,
        stripeWebhookSecret,
        resendApiKeyHash,
      },
    });

    // 6. Revalidate so the server component re-fetches fresh data
    revalidatePath("/dashboard/settings");

    return {
      status: "success",
      message: "Settings saved successfully.",
    };
  } catch (err) {
    console.error("[saveSettings]", err);
    return {
      status: "error",
      message: "Failed to save settings. Please try again.",
    };
  }
}
