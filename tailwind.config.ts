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
        app: {
          bg: "#191919",
          sidebar: "#20201F",
          card: "#222220",
          elevated: "#292927",
          border: "#383733",
          primary: "#F1F0EB",
          secondary: "#A5A39D",
          tertiary: "#76746E",
          accent: "#2F658E",
          "accent-hover": "#255273",
          "accent-muted": "#1F2E3B",
          "accent-text": "#8CB2D4",
        },
      },
      fontFamily: {
        serif: [
          "Newsreader",
          "Lora",
          "Charter",
          "Sitka Text",
          "Cambria",
          "Georgia",
          "serif",
        ],
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
