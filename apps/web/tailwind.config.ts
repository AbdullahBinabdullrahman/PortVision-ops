import type { Config } from "tailwindcss";

const rgbVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: rgbVar("--color-bg"),
        "bg-secondary": rgbVar("--color-bg-secondary"),
        card: rgbVar("--color-card"),
        "card-hover": rgbVar("--color-card-hover"),
        "card-inner": rgbVar("--color-card-inner"),
        accent: {
          DEFAULT: rgbVar("--color-accent"),
          light: rgbVar("--color-accent-light"),
          dim: rgbVar("--color-accent-dim"),
        },
        text: {
          DEFAULT: rgbVar("--color-text"),
          muted: rgbVar("--color-text-muted"),
          dim: rgbVar("--color-text-dim"),
        },
        border: {
          DEFAULT: rgbVar("--color-border"),
          light: rgbVar("--color-border-light"),
        },
        success: rgbVar("--color-success"),
        warning: rgbVar("--color-warning"),
        danger: rgbVar("--color-danger"),
      },
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans Arabic", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["IBM Plex Sans Arabic", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 30px rgb(var(--color-accent) / 0.25)",
        "glow-strong": "0 0 30px rgb(var(--color-accent) / 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
