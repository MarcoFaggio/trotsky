import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
} from "@/lib/auth";
import {
  attachAuthSessionCookies,
  clearAuthSessionCookies,
} from "@/lib/auth-cookies";
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
    if (!user || user.disabledAt) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    // Revocation check: a bumped tokenVersion (logout, password/role change,
    // deactivation) invalidates every refresh token issued before the bump.
    if (payload.ver !== user.tokenVersion) {
      const response = NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
      clearAuthSessionCookies(response);
      return response;
    }

    // Role and email are re-read from the row, so rotation can't carry a stale
    // privilege forward the way copying the old claims would.
    const claims = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.tokenVersion,
    };
    const accessToken = await createAccessToken(claims);
    const refreshToken = await createRefreshToken(claims);

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
