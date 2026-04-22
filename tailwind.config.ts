import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep backdrop
        ink: {
          950: "#05060a",
          900: "#0a0c12",
          800: "#0f1219",
          700: "#151923",
          600: "#1e2330",
          500: "#2a3040",
        },
        // Neon accents
        neon: {
          pink: "#ff2d94",
          pinkSoft: "#ff6bb3",
          cyan: "#22e4ff",
          cyanSoft: "#7df1ff",
          lime: "#b7ff4a",
          amber: "#ffb547",
        },
        // GitHub-parity tokens for preview
        gh: {
          bg: "#0d1117",
          bgLight: "#ffffff",
          fg: "#e6edf3",
          fgLight: "#1f2328",
          border: "#30363d",
          borderLight: "#d0d7de",
          muted: "#7d8590",
          accent: "#2f81f7",
          code: "#161b22",
        },
      },
      fontFamily: {
        display: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        "neon-pink": "0 0 20px rgba(255, 45, 148, 0.35), 0 0 40px rgba(255, 45, 148, 0.15)",
        "neon-cyan": "0 0 20px rgba(34, 228, 255, 0.35), 0 0 40px rgba(34, 228, 255, 0.15)",
        "inner-glow": "inset 0 0 20px rgba(34, 228, 255, 0.05)",
        "panel": "0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at center, rgba(34,228,255,0.06) 1px, transparent 1px)",
        "neon-gradient":
          "linear-gradient(135deg, rgba(255,45,148,0.15) 0%, rgba(34,228,255,0.15) 100%)",
        "glass":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2.5s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 2s linear infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { opacity: "0.7", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        github: {
          css: {
            "--tw-prose-body": theme("colors.gh.fg"),
            "--tw-prose-headings": theme("colors.gh.fg"),
            "--tw-prose-lead": theme("colors.gh.fg"),
            "--tw-prose-links": theme("colors.gh.accent"),
            "--tw-prose-bold": theme("colors.gh.fg"),
            "--tw-prose-counters": theme("colors.gh.muted"),
            "--tw-prose-bullets": theme("colors.gh.muted"),
            "--tw-prose-hr": theme("colors.gh.border"),
            "--tw-prose-quotes": theme("colors.gh.muted"),
            "--tw-prose-quote-borders": theme("colors.gh.border"),
            "--tw-prose-captions": theme("colors.gh.muted"),
            "--tw-prose-code": theme("colors.gh.fg"),
            "--tw-prose-pre-code": theme("colors.gh.fg"),
            "--tw-prose-pre-bg": theme("colors.gh.code"),
            "--tw-prose-th-borders": theme("colors.gh.border"),
            "--tw-prose-td-borders": theme("colors.gh.border"),
            maxWidth: "none",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
            fontSize: "16px",
            lineHeight: "1.5",
            h1: {
              fontSize: "2em",
              paddingBottom: "0.3em",
              borderBottom: `1px solid ${theme("colors.gh.border")}`,
              fontWeight: "600",
              marginTop: "24px",
              marginBottom: "16px",
            },
            h2: {
              fontSize: "1.5em",
              paddingBottom: "0.3em",
              borderBottom: `1px solid ${theme("colors.gh.border")}`,
              fontWeight: "600",
              marginTop: "24px",
              marginBottom: "16px",
            },
            h3: { fontSize: "1.25em", fontWeight: "600" },
            h4: { fontSize: "1em", fontWeight: "600" },
            code: {
              backgroundColor: "rgba(110,118,129,0.4)",
              padding: "0.2em 0.4em",
              borderRadius: "6px",
              fontSize: "85%",
              fontWeight: "400",
            },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            pre: {
              backgroundColor: theme("colors.gh.code"),
              padding: "16px",
              borderRadius: "6px",
              overflow: "auto",
              fontSize: "85%",
              lineHeight: "1.45",
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
              fontSize: "100%",
            },
            blockquote: {
              borderLeftColor: theme("colors.gh.border"),
              color: theme("colors.gh.muted"),
              fontStyle: "normal",
              padding: "0 1em",
            },
            "blockquote p::before": { content: '""' },
            "blockquote p::after": { content: '""' },
            table: {
              display: "block",
              width: "100%",
              overflow: "auto",
              borderSpacing: "0",
              borderCollapse: "collapse",
            },
            "table th": {
              padding: "6px 13px",
              border: `1px solid ${theme("colors.gh.border")}`,
              fontWeight: "600",
            },
            "table td": {
              padding: "6px 13px",
              border: `1px solid ${theme("colors.gh.border")}`,
            },
            "table tr:nth-child(2n)": {
              backgroundColor: "rgba(110,118,129,0.1)",
            },
            img: {
              maxWidth: "100%",
              boxSizing: "content-box",
              backgroundColor: "transparent",
              marginTop: "0",
              marginBottom: "0",
            },
            hr: {
              height: "0.25em",
              padding: "0",
              margin: "24px 0",
              backgroundColor: theme("colors.gh.border"),
              border: "0",
            },
            a: {
              color: theme("colors.gh.accent"),
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
