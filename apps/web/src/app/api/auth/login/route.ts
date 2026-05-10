import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import { loginSchema } from "@hotel-pricing/shared";
import bcrypt from "bcryptjs";
import {
  createAccessToken,
  createRefreshToken,
} from "@/lib/auth";
import { attachAuthSessionCookies } from "@/lib/auth-cookies";
import { checkRateLimitAsync } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkRateLimitAsync(`login:${ip}`);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Login error:", message, stack ?? error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
