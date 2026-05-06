// =============================================================================
// app/login/login-form.tsx
// "use client" — Magic link login form. Fixed submit flow.
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { useSearchParams }   from "next/navigation";
import { useActionState }    from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { sendMagicLink, type LoginActionState } from "./actions";

const initialState: LoginActionState = { status: "idle" };

export function LoginForm() {
  const searchParams = useSearchParams();
  const urlState     = searchParams.get("state");
  const emailRef     = useRef<HTMLInputElement>(null);

  const [actionState, formAction, isPending] = useActionState(
    sendMagicLink,
    initialState
  );

  const isSuccess = actionState.status === "success" || urlState === "check-email";
  const isError   = actionState.status === "error"   || urlState === "error";
  const errorMessage =
    actionState.status === "error"
      ? actionState.message
      : "Sign-in link is invalid or expired. Please try again.";

  const submittedEmail = emailRef.current?.value ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm"
    >
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm tracking-tight">I</span>
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">InvoiceApp</span>
      </div>

      <AnimatePresence mode="wait">
        {/* SUCCESS */}
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20"
            >
              <CheckCircle className="h-8 w-8 text-blue-400" strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-3">
              Check your inbox
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We sent a magic link
              {submittedEmail && (
                <> to <span className="text-neutral-200 font-medium">{submittedEmail}</span></>
              )}
              . It expires in 24 hours.
            </p>
            <p className="mt-8 text-xs text-neutral-600">
              Didn&apos;t get it?{" "}
              <a href="/login" className="text-blue-500 hover:text-blue-400 transition-colors underline underline-offset-2">
                Try again
              </a>
            </p>
          </motion.div>
        ) : (
          /* FORM */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-neutral-500 mb-8">
              Enter your email to receive a secure sign-in link.
            </p>

            {/* Error banner */}
            <AnimatePresence>
              {isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-3">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <p className="text-sm text-red-300">{errorMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form — use native action, no RHF interference */}
            <form action={formAction} noValidate>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium text-neutral-400 uppercase tracking-wider"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600"
                      strokeWidth={1.5}
                    />
                    <input
                      ref={emailRef}
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      required
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-700 outline-none transition-all duration-200 focus:bg-white/[0.05] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileHover={{ scale: isPending ? 1 : 1.01 }}
                  whileTap={{ scale: isPending ? 1 : 0.99 }}
                  className="relative w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white tracking-tight flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                >
                  <AnimatePresence mode="wait">
                    {isPending ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending link…
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        Continue
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>

            <p className="mt-6 text-center text-xs text-neutral-700">
              No password needed. No account? One click creates yours.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
