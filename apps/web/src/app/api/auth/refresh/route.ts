import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
} from "@/lib/auth";
import { attachAuthSessionCookies } from "@/lib/auth-cookies";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { clientIpKey } from "@/lib/client-ip";

export async function POST(request: NextRequest) {
  try {
    // Generous cap (NAT-friendly) that still blocks forged-token probing.
    const rateLimit = await checkRateLimitAsync(
      `refresh:${clientIpKey(request)}`,
      { max: 30 }
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many refresh attempts. Please try again later." },
        { status: 429 }
      );
    }

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

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
    attachAuthSessionCookies(response, accessToken, refreshToken);
    return response;
  } catch {
    return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
  }
}
