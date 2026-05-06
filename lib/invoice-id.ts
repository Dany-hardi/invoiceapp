// =============================================================================
// lib/invoice-id.ts
// Custom 12-character invoice number generator with collision-safe retry loop.
// Format: "{PREFIX}-{9 cryptographically secure digits}"
// e.g., "DEV-483920174" | "INV-019283746"
// =============================================================================

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_RETRIES = 10;

/**
 * Generates a cryptographically secure 9-digit numeric suffix.
 * Uses crypto.randomBytes to avoid Math.random() bias.
 */
function generateSuffix(): string {
  // 4 random bytes → 32-bit uint → modulo to get 9-digit number
  const buf = randomBytes(4);
  const uint = buf.readUInt32BE(0);
  // Ensure exactly 9 digits: range [100_000_000, 999_999_999]
  const nineDigit = (uint % 900_000_000) + 100_000_000;
  return nineDigit.toString();
}

/**
 * Generates a unique invoice number for a given user.
 * Reads the user's configured prefix from FreelancerSettings (default: "INV").
 * Retries up to MAX_RETRIES times on collision.
 *
 * @param userId - The authenticated user's ID
 * @returns A unique invoice number string, e.g. "DEV-483920174"
 * @throws Error if unable to generate a unique ID after MAX_RETRIES attempts
 */
export async function generateInvoiceNumber(userId: string): Promise<string> {
  // Fetch user's custom prefix (default "INV" if not configured)
  const settings = await prisma.freelancerSettings.findUnique({
    where: { userId },
    select: { invoicePrefix: true },
  });

  const prefix = settings?.invoicePrefix?.trim().toUpperCase() || "INV";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const suffix = generateSuffix();
    const candidate = `${prefix}-${suffix}`; // e.g. "DEV-483920174"

    // Check uniqueness at DB level (the schema has a UNIQUE constraint as safety net)
    const existing = await prisma.invoice.findUnique({
      where: { invoiceNumber: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    // Collision detected — log and retry
    console.warn(
      `[InvoiceID] Collision on attempt ${attempt}/${MAX_RETRIES}: ${candidate}`
    );
  }

  // Exhausted retries — this is astronomically unlikely (1/900M per try)
  // but we handle it gracefully
  throw new Error(
    `[InvoiceID] Failed to generate unique invoice number after ${MAX_RETRIES} attempts. ` +
      `Prefix: "${prefix}". Check for data integrity issues.`
  );
}

/**
 * Synchronous version for use in tests or when no DB context is available.
 * Does NOT check for collisions — use generateInvoiceNumber() in production.
 */
export function generateInvoiceNumberSync(prefix = "INV"): string {
  const suffix = generateSuffix();
  return `${prefix.trim().toUpperCase()}-${suffix}`;
}
