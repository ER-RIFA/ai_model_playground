import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        workbench: {
          bg: "#0B0C0E",
          surface: "#111317",
          panel: "#16191F",
          subpanel: "#1A1D24",
          hover: "#21262F",
          active: "#272D38",
          border: "#222630",
          "border-subtle": "#1B1E26",
          "text-primary": "#F1F3F5",
          "text-secondary": "#9CA3AF",
          "text-muted": "#64748B",
          accent: "#2563EB",
          "accent-hover": "#1D4ED8",
          "accent-subtle": "#1E2A3F",
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
