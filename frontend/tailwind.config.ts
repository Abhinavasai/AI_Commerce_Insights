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
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          DEFAULT: "#1b2b4b",
          soft: "#3a4d73",
          muted: "#6b7c99",
        },
        paper: {
          DEFAULT: "#fffdf8",
          warm: "#fff1d6",
          blush: "#ffe8e6",
        },
        coral: {
          DEFAULT: "#ff5a5f",
          dark: "#e8484d",
          soft: "#ffe8e6",
        },
        sun: {
          DEFAULT: "#ffd166",
          soft: "#fff1d6",
        },
        mint: {
          DEFAULT: "#06d6a0",
          dark: "#05b586",
          soft: "#d8fff3",
        },
        sky: {
          cartoon: "#4cc9f0",
          soft: "#d9f4ff",
        },
        /* Remap legacy teal usages to cartoon mint */
        teal: {
          50: "#d8fff3",
          100: "#b3ffe6",
          200: "#7ef5cf",
          300: "#3ee8b5",
          400: "#14dba0",
          500: "#06d6a0",
          600: "#05b586",
          700: "#04906b",
          800: "#036b50",
          900: "#024836",
          accent: "#06d6a0",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        display: ["var(--font-fredoka)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        comic: "1.25rem",
      },
      boxShadow: {
        comic: "4px 4px 0 0 rgba(27, 43, 75, 0.14)",
        "comic-lg": "6px 6px 0 0 rgba(27, 43, 75, 0.16)",
        "comic-hover": "6px 6px 0 0 rgba(27, 43, 75, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
