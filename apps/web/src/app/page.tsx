import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { LandingPage } from "@/components/landing/landing-page";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-jwt-secret"
);

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
      await jwtVerify(token, JWT_SECRET);
      redirect("/dashboard");
    } catch {
      // Token invalid or expired; show landing
    }
  }
  return <LandingPage />;
}
