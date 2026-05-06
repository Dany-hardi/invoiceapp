// =============================================================================
// tailwind.config.ts
// Design system tokens — Deep Space Black, Ghost White, Electric Blue
// =============================================================================

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // -----------------------------------------------------------------------
      // Brand Colors
      // -----------------------------------------------------------------------
      colors: {
        // Background scale
        background: {
          DEFAULT: "#0A0A0A",   // Deep Space Black
          subtle: "#111111",
          muted: "#161616",
          elevated: "#1A1A1A",
        },
        // Border scale
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          subtle: "rgba(255,255,255,0.04)",
          strong: "rgba(255,255,255,0.12)",
        },
        // Text scale
        foreground: {
          DEFAULT: "#F8F8F8",   // Ghost White
          muted: "#888888",
          subtle: "#555555",
          ghost: "#333333",
        },
        // Accent — Electric Blue
        accent: {
          DEFAULT: "#3B82F6",
          hover: "#60A5FA",
          muted: "rgba(59,130,246,0.12)",
          border: "rgba(59,130,246,0.25)",
        },
        // Status colors
        success: {
          DEFAULT: "#22C55E",
          muted: "rgba(34,197,94,0.1)",
          border: "rgba(34,197,94,0.2)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          muted: "rgba(245,158,11,0.1)",
          border: "rgba(245,158,11,0.2)",
        },
        danger: {
          DEFAULT: "#EF4444",
          muted: "rgba(239,68,68,0.05)",
          border: "rgba(239,68,68,0.2)",
        },
      },

      // -----------------------------------------------------------------------
      // Typography — Geist (primary), Inter (fallback)
      // -----------------------------------------------------------------------
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Fira Code", "monospace"],
      },
      fontSize: {
        // Tight, precise scale
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs:    ["0.75rem",  { lineHeight: "1rem" }],
        sm:    ["0.8125rem",{ lineHeight: "1.25rem" }],
        base:  ["0.9375rem",{ lineHeight: "1.5rem" }],
        lg:    ["1.0625rem",{ lineHeight: "1.75rem" }],
        xl:    ["1.1875rem",{ lineHeight: "1.75rem" }],
        "2xl": ["1.375rem", { lineHeight: "2rem" }],
        "3xl": ["1.75rem",  { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.5rem" }],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight:   "-0.025em",
        snug:    "-0.015em",
        normal:  "0em",
        wide:    "0.025em",
        wider:   "0.06em",
        widest:  "0.12em",
      },

      // -----------------------------------------------------------------------
      // Border Radius
      // -----------------------------------------------------------------------
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },

      // -----------------------------------------------------------------------
      // Box Shadow — layered, dark-mode optimised
      // -----------------------------------------------------------------------
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "dropdown": "0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
        "focus-accent": "0 0 0 2px rgba(59,130,246,0.35)",
        "glow-accent": "0 0 24px rgba(59,130,246,0.15)",
      },

      // -----------------------------------------------------------------------
      // Animations
      // -----------------------------------------------------------------------
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-up": "slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
