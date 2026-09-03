import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { LandingPage } from "@/components/landing/landing-page";
import { jwtAccessSecretBytes } from "@/lib/jwt-secrets";

export const metadata = {
  title: "Trosky | Hotel revenue intelligence from Cork, Ireland",
  description:
    "Trosky checks your comp set on Booking.com and Expedia daily, lines it up against pace, occupancy and events, and turns the gap into rate actions. Built in Cork, hosted in the EU.",
};

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  let authenticated = false;
  if (token) {
    try {
      await jwtVerify(token, jwtAccessSecretBytes(), {
        algorithms: ["HS256"],
      });
      authenticated = true;
    } catch {
      // Token invalid or expired; show landing
    }
  }
  // redirect() throws internally, so it must live outside the try/catch.
  if (authenticated) redirect("/dashboard");
  return <LandingPage />;
}
