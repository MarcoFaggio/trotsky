import { NextRequest, NextResponse } from "next/server";
import { getOverviewData } from "@/services/dashboard-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const range = parseInt(
      _request.nextUrl.searchParams.get("range") || "14"
    );
    const data = await getOverviewData(params.hotelId, range);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
