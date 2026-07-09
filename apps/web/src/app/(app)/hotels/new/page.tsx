import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NewHotelForm } from "@/components/hotels/new-hotel-form";

export default async function NewHotelPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ANALYST") redirect("/dashboard");

  return <NewHotelForm />;
}
