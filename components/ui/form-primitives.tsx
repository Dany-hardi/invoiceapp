// =============================================================================
// components/ui/form-primitives.tsx
// Reusable, design-system-aligned form building blocks.
// All accept className for overrides. Zero layout-shift error states.
// =============================================================================

"use client";

import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// SectionCard — groups related fields with a header
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-white/[0.06] bg-[#111111]",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Icon className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-neutral-600 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FieldGrid — responsive 2-column grid for form fields
// ---------------------------------------------------------------------------

export function FieldGrid({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormField — label + input + error wrapper
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 uppercase tracking-wider"
      >
        {label}
        {required && <span className="text-blue-500">*</span>}
      </label>

      {children}

      {/* Hint text */}
      {hint && !error && (
        <p className="text-[11px] text-neutral-700">{hint}</p>
      )}

      {/* Error — smooth slide-down, no layout shift */}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 2 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center gap-1.5 overflow-hidden text-[11px] text-red-400"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormInput — styled text input
// ---------------------------------------------------------------------------

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  prefix?: string;    // e.g. "$" or "https://"
  suffix?: string;    // e.g. "%"
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ hasError, prefix, suffix, className, ...props }, ref) => {
    const base = cn(
      "w-full rounded-lg border bg-white/[0.03] py-2.5 text-sm text-white",
      "placeholder:text-neutral-700 outline-none",
      "transition-all duration-150",
      "focus:bg-white/[0.05]",
      hasError
        ? "border-red-500/40 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
        : "border-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10",
      prefix ? "pl-8" : "pl-3",
      suffix ? "pr-8" : "pr-3",
      props.disabled && "opacity-50 cursor-not-allowed",
      className
    );

    if (prefix || suffix) {
      return (
        <div className="relative">
          {prefix && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-600 select-none">
              {prefix}
            </span>
          )}
          <input ref={ref} className={base} {...props} />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-600 select-none">
              {suffix}
            </span>
          )}
        </div>
      );
    }

    return <input ref={ref} className={base} {...props} />;
  }
);
FormInput.displayName = "FormInput";

// ---------------------------------------------------------------------------
// FormTextarea — styled textarea
// ---------------------------------------------------------------------------

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ hasError, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-white/[0.03] px-3 py-2.5 text-sm text-white",
        "placeholder:text-neutral-700 outline-none resize-none",
        "transition-all duration-150",
        "focus:bg-white/[0.05]",
        hasError
          ? "border-red-500/40 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
          : "border-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10",
        className
      )}
      {...props}
    />
  )
);
FormTextarea.displayName = "FormTextarea";

// ---------------------------------------------------------------------------
// FormSelect — styled select
// ---------------------------------------------------------------------------

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options: { value: string; label: string }[];
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ hasError, options, className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-[#111111] px-3 py-2.5 text-sm text-white",
        "outline-none appearance-none cursor-pointer",
        "transition-all duration-150",
        "focus:bg-[#161616]",
        hasError
          ? "border-red-500/40 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
          : "border-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10",
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#161616]">
          {opt.label}
        </option>
      ))}
    </select>
  )
);
FormSelect.displayName = "FormSelect";

// ---------------------------------------------------------------------------
// ApiKeyInput — password input with masked display and "update" toggle
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

interface ApiKeyInputProps extends Omit<FormInputProps, "type"> {
  isSet?: boolean;       // True if a hash already exists in DB
  label?: string;
}

export function ApiKeyInput({ isSet, label, ...props }: ApiKeyInputProps) {
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(!isSet);

  if (!editing && isSet) {
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex flex-1 items-center gap-2 rounded-lg border border-white/[0.08]",
          "bg-white/[0.02] px-3 py-2.5"
        )}>
          <ShieldCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" strokeWidth={1.75} />
          <span className="text-xs text-neutral-500 tracking-[0.2em]">
            ••••••••••••••••
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "rounded-lg border border-white/[0.08] px-3 py-2.5",
            "text-xs text-neutral-500 hover:text-white hover:border-white/20",
            "transition-colors duration-150 whitespace-nowrap"
          )}
        >
          Update
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <FormInput
        type={revealed ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        placeholder={isSet ? "Enter new value to update…" : `Paste your ${label ?? "key"} here`}
        {...props}
        className={cn("pr-10", props.className)}
      />
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
        aria-label={revealed ? "Hide" : "Show"}
        tabIndex={-1}
      >
        {revealed
          ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
          : <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
        }
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SaveButton — submit button with pending / success states
// ---------------------------------------------------------------------------

type SaveState = "idle" | "pending" | "success" | "error";

interface SaveButtonProps {
  state: SaveState;
  className?: string;
}

export function SaveButton({ state, className }: SaveButtonProps) {
  return (
    <motion.button
      type="submit"
      disabled={state === "pending"}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-5 py-2.5",
        "text-sm font-semibold tracking-tight",
        "transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
        state === "success"
          ? "bg-green-600 hover:bg-green-500 text-white"
          : state === "error"
          ? "bg-red-600 hover:bg-red-500 text-white"
          : "bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "pending" && (
          <motion.span
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </motion.span>
        )}
        {state === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </motion.span>
        )}
        {(state === "idle" || state === "error") && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {state === "error" ? "Try again" : "Save changes"}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
