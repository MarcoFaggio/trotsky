import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import { loginSchema } from "@hotel-pricing/shared";
import bcrypt from "bcryptjs";
import {
  createAccessToken,
  createRefreshToken,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(`login:${ip}`);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const debugSecret = process.env.DEBUG_LOGIN_SECRET;

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

    response.cookies.set("access_token", accessToken, {
      ...COOKIE_OPTS,
      maxAge: 15 * 60,
    });
    response.cookies.set("refresh_token", refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Login error:", message, stack ?? error);

    const body: { error: string; debug?: string } = {
      error: "Internal server error",
    };
    if (debugSecret && request.headers.get("x-debug-login") === debugSecret) {
      body.debug = message;
    }

    return NextResponse.json(body, { status: 500 });
  }
}
