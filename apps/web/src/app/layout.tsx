import type { Metadata, Viewport } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { RouteProvider } from "@/providers/router-provider";
import "./globals.css";

// Self-hosted through next/font: no render-blocking request to Google, no
// flash of fallback text, and the CSP no longer needs the fonts.googleapis
// origins.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

// Variable font: omit `weight` so next/font ships the full wght range, which is
// what unlocks the optical-size axis used by the serif accents.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["italic", "normal"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
  // Next 14.1 has no fallback metrics table entry for Newsreader; it is only
  // ever used for short accents, so a size-adjusted fallback is not needed.
  adjustFontFallback: false,
});

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

const SITE_URL = "https://trosky-ai.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Trosky | Hotel revenue intelligence",
    template: "%s | Trosky",
  },
  description:
    "Hotel revenue intelligence for European operators. Trosky runs from Cork, Ireland and India, with production data hosted in the EU.",
  applicationName: "Trosky",
  icons: {
    icon: "/trosky-image.png",
    apple: "/trosky-image.png",
  },
  openGraph: {
    type: "website",
    siteName: "Trosky",
    locale: "en_IE",
    url: SITE_URL,
    title: "Trosky | Hotel revenue intelligence",
    description:
      "Competitor rates, pace, events and inquiries in one command centre. Built in Cork, Ireland. Hosted in the EU.",
    images: [{ url: "/trosky-image.png", width: 1254, height: 1254, alt: "Trosky" }],
  },
  twitter: {
    card: "summary",
    title: "Trosky | Hotel revenue intelligence",
    description:
      "Competitor rates, pace, events and inquiries in one command centre. Built in Cork, Ireland. Hosted in the EU.",
    images: ["/trosky-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0b0b" },
  ],
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${newsreader.variable}`}
    >
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
