import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "gh-bg": "#0d1117",
        "gh-surface": "#161b22",
        "gh-border": "#30363d",
        "gh-muted": "#8b949e",
        "gh-text": "#e6edf3",
        amber: {
          DEFAULT: "#f0a500",
          dark: "#c98a00",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f0a500",
          600: "#c98a00",
          700: "#a36600",
          800: "#7d4d00",
          900: "#573600",
        },
        emerald: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        rose: {
          DEFAULT: "#f43f5e",
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "grid-pulse": "gridPulse 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "cursor-blink": "cursorBlink 1s step-end infinite",
        "spin-slow": "spin 3s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        gridPulse: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.8" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        cursorBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(240, 165, 0, 0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(240, 165, 0, 0.65)" },
        },
      },
      boxShadow: {
        "amber-glow": "0 0 20px rgba(240, 165, 0, 0.25)",
        "emerald-glow": "0 0 20px rgba(16, 185, 129, 0.25)",
        "rose-glow": "0 0 20px rgba(244, 63, 94, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
