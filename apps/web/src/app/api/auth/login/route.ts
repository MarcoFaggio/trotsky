import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import { loginSchema } from "@hotel-pricing/shared";
import bcrypt from "bcryptjs";
import {
  createAccessToken,
  createRefreshToken,
} from "@/lib/auth";
import { attachAuthSessionCookies } from "@/lib/auth-cookies";
import { checkRateLimits } from "@/lib/rate-limiter";
import { clientIpKey } from "@/lib/client-ip";

// Constant-cost comparison target so unknown emails take as long as known ones.
const TIMING_PAD_HASH =
  "$2b$10$6ckW9Ewrtk1d//X2mpe6P.r1bAExzyL/Iw57mfVcKSm1yEgsXXUQm";

const TOO_MANY_ATTEMPTS = {
  error: "Too many login attempts. Please try again later.",
};

export async function POST(request: NextRequest) {
  const ip = clientIpKey(request);

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      // Still costs the caller an IP budget slot, so malformed bodies can't be
      // used to probe for free.
      await checkRateLimits([{ key: `login:ip:${ip}` }]);
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Two buckets: per-IP stops one host hammering many accounts, per-account
    // stops a distributed guess against a single high-value login.
    const rateLimit = await checkRateLimits([
      { key: `login:ip:${ip}` },
      { key: `login:account:${normalizedEmail}`, options: { max: 10 } },
    ]);
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      );
      return NextResponse.json(TOO_MANY_ATTEMPTS, {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await bcrypt.compare(password, TIMING_PAD_HASH);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Deactivated accounts are indistinguishable from bad credentials.
    if (user.disabledAt) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Login error:", message, stack ?? error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
