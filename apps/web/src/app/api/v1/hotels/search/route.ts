import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ANALYST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const hotels = await prisma.hotel.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { pmsName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      city: true,
      pmsName: true,
      thumbnailUrl: true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    { results: hotels },
    {
      headers: {
        "Cache-Control": "private, max-age=600",
      },
    }
  );
}
