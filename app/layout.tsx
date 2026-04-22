import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Markdown Studio",
  description:
    "A hyper-versatile Markdown & README studio with GitHub-parity preview, DevSecOps scanning, and 3D export.",
  manifest: "/manifest.webmanifest",
  applicationName: "Markdown Studio",
  authors: [{ name: "Universal Markdown Studio" }],
  keywords: [
    "markdown",
    "readme",
    "github",
    "editor",
    "pwa",
    "next.js",
    "devsecops",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  /**
   * Inline script that runs before React hydrates to set the correct
   * theme class on <html>. Reads the persisted Zustand store directly
   * out of localStorage so the very first paint is in the user's chosen
   * mode — no flash-of-wrong-theme.
   *
   * Uses `dangerouslySetInnerHTML` because Next inlines this verbatim; the
   * source is fully static, so there's no injection vector.
   */
  const themeInit = `
(function () {
  try {
    var raw = localStorage.getItem("universal-markdown-studio-v1");
    var theme = "dark";
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.state.theme === "light") {
        theme = "light";
      }
    }
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.classList.add("dark");
  }
})();
`.trim();

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
