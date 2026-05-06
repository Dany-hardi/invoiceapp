// =============================================================================
// app/login/actions.ts
// Server Action — Magic Link dispatch with Zod email validation.
// =============================================================================

"use server";

import { z }         from "zod";
import { signIn }    from "@/auth";
import { AuthError } from "next-auth";

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
});

export type LoginActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "validation_error"; errors: { email?: string[] } };

export async function sendMagicLink(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const rawEmail = formData.get("email");

  const parsed = LoginSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return {
      status: "validation_error",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email } = parsed.data;

  try {
    console.log("[sendMagicLink] Sending to:", email);

    await signIn("resend", {
      email,
      redirect: false,
    });

    console.log("[sendMagicLink] Success");
    return { status: "success" };

  } catch (error: unknown) {
    // Auth.js v5 sometimes throws NEXT_REDIRECT even with redirect:false
    // Treat it as success — the email was sent
    const err = error as { message?: string; digest?: string };
    if (
      err?.digest?.includes("NEXT_REDIRECT") ||
      err?.message?.includes("NEXT_REDIRECT")
    ) {
      console.log("[sendMagicLink] NEXT_REDIRECT — email sent successfully");
      return { status: "success" };
    }

    if (error instanceof AuthError) {
      console.error("[sendMagicLink] AuthError:", error.type, error.message);
      return {
        status: "error",
        message: `Auth error (${error.type}): ${error.message}`,
      };
    }

    console.error("[sendMagicLink] Unknown error:", error);
    return {
      status: "error",
      message: `Error: ${err?.message ?? String(error)}`,
    };
  }
}
