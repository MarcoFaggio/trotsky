import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const refreshTokenCookie = request.cookies.get("refresh_token")?.value;
    if (!refreshTokenCookie) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshTokenCookie);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await createRefreshToken({ sub: user.id });

    setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch {
    return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
  }
}
