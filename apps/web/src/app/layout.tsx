import type { Metadata } from "next";
import "./globals.css";

const themeScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("trosky:theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Fraunces:opsz,wght@9..144,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
