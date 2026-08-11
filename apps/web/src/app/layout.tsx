import type { Metadata } from "next";
import { headers } from "next/headers";
import { RouteProvider } from "@/providers/router-provider";
import "./globals.css";

const themeScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("trosky:theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme || (prefersDark ? "dark" : "light");
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("dark-mode", isDark);
  } catch {}
})();
`;

export const metadata: Metadata = {
  title: "Trosky | Hotel Revenue Intelligence",
  description: "Hotel revenue intelligence for rate, pace, occupancy, and inquiry workflows.",
  icons: {
    icon: "/trosky-image.png",
    apple: "/trosky-image.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware mints a per-request CSP nonce. Next stamps its own bundles
  // automatically, but this hand-written inline script needs it explicitly or
  // an enforced policy blocks it and the page flashes the wrong theme.
  //
  // Reading a header also opts every route out of static prerendering, which is
  // required for nonces to work at all — a build-time HTML file cannot carry a
  // per-request value.
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <RouteProvider>{children}</RouteProvider>
      </body>
    </html>
  );
}
