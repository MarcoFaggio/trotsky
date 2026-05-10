import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { Fraunces, DM_Sans } from "next/font/google";
import { LandingPage } from "@/components/landing/landing-page";
import { jwtAccessSecretBytes } from "@/lib/jwt-secrets";

const landingDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-landing-display",
  display: "swap",
});

const landingSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-landing-body",
  display: "swap",
});

export const metadata = {
  title: "Trosky Analytics – Automated Hotel Rate Tracking & Market Intelligence",
  description:
    "Trosky Analytics automates hotel rate tracking across OTAs and direct channels. Save time, react faster, and make better pricing decisions with real-time market intelligence.",
};

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (token) {
    try {
      await jwtVerify(token, jwtAccessSecretBytes());
      redirect("/dashboard");
    } catch {
      // Token invalid or expired; show landing
    }
  }
  return (
    <div className={`${landingDisplay.variable} ${landingSans.variable}`}>
      <LandingPage />
    </div>
  );
}
