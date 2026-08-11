import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@hotel-pricing/db";
import type { JWTPayload, SessionTokenClaims } from "@hotel-pricing/shared";
import {
  jwtAccessSecretBytes,
  jwtRefreshSecretBytes,
} from "@/lib/jwt-secrets";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function createAccessToken(
  claims: SessionTokenClaims
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(jwtAccessSecretBytes());
}

export async function createRefreshToken(
  claims: SessionTokenClaims
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .sign(jwtRefreshSecretBytes());
}

export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtAccessSecretBytes(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtRefreshSecretBytes(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Raw access-token claims — signature verified, nothing else.
 *
 * Does not see revocation, deactivation, or a role changed since the token was
 * issued. Only use where that is genuinely irrelevant (the landing page's
 * "am I logged in?" redirect). Everything that reads or writes data must use
 * {@link getSession}.
 */
export async function getAccessTokenClaims(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return null;
  return verifyAccessToken(accessToken);
}

export type SessionUser = {
  sub: string;
  email: string;
  role: "ANALYST" | "CLIENT";
  name: string | null;
};

/**
 * The authenticated user for this request, re-read from the database.
 *
 * This is the session boundary. Role comes from the User row rather than the
 * token, so a demotion applies on the next request instead of lingering for the
 * token's lifetime, and `tokenVersion` / `disabledAt` let logout and
 * deactivation actually revoke access — a signed token alone is not enough.
 *
 * Wrapped in React `cache()`: a layout, the page it renders, and every service
 * they call share one query per request.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const claims = await getAccessTokenClaims();
  if (!claims?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      tokenVersion: true,
      disabledAt: true,
    },
  });

  if (!user || user.disabledAt) return null;
  // Tokens minted before `ver` existed are treated as stale — fail closed.
  if (typeof claims.ver !== "number" || claims.ver !== user.tokenVersion) {
    return null;
  }

  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
});
