import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import { ScrapeAdmin } from "@/components/dashboard/scrape-admin";

export default async function ScrapeAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") redirect("/dashboard");

  const runs = await prisma.scrapeRun.findMany({
    include: {
      _count: { select: { errors: true, rates: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return <ScrapeAdmin runs={runs} />;
}
