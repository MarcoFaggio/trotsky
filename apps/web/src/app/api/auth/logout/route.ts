import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import { verifyRefreshToken } from "@/lib/auth";
import { clearAuthSessionCookies } from "@/lib/auth-cookies";

/**
 * Public so an expired session can still clear its own cookies.
 *
 * Clearing cookies alone does not end a session — a copy of the refresh token
 * taken beforehand would keep working. Bumping `tokenVersion` invalidates every
 * token issued to this user, which is what makes logout meaningful.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearAuthSessionCookies(response);

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload?.sub) {
      // Best effort: the user is logged out regardless of whether this lands.
      await prisma.user
        .update({
          where: { id: payload.sub },
          data: { tokenVersion: { increment: 1 } },
        })
        .catch(() => {});
    }
  }

  return response;
}
