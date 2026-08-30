import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import {
  jwtAccessSecretBytes,
  jwtRefreshSecretBytes,
} from "@/lib/jwt-secrets";
import {
  applySecurityHeaders,
  buildCsp,
  generateNonce,
} from "@/lib/security-headers";
import { isPublicPath } from "@/lib/public-paths";

const ACCESS_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 15 * 60,
};

const REFRESH_COOKIE = {
  ...ACCESS_COOKIE,
  maxAge: 7 * 24 * 60 * 60,
};

const STATIC_ASSET = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|woff2?|txt|xml)$/i;

const CANONICAL_HOST = "trosky-ai.com";

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host !== `www.${CANONICAL_HOST}`) return null;
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

function unauthorized(request: NextRequest, clearCookies: boolean): NextResponse {
  let response: NextResponse;
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const loginUrl = new URL("/login", request.url);
    // Preserve where the user was headed so login can send them back.
    const target = request.nextUrl.pathname + request.nextUrl.search;
    if (target && target !== "/") loginUrl.searchParams.set("next", target);
    response = NextResponse.redirect(loginUrl);
  }
  if (clearCookies) {
    response.cookies.set("access_token", "", { ...ACCESS_COOKIE, maxAge: 0 });
    response.cookies.set("refresh_token", "", { ...REFRESH_COOKIE, maxAge: 0 });
  }
  return response;
}

/**
 * Mint a short-lived access token from a still-valid refresh token so an
 * expired access cookie doesn't bounce the user to /login mid-session.
 *
 * Deliberately narrow:
 * - The refresh token is **not** re-issued. Rotating it here on every access
 *   expiry gave a stolen cookie an indefinitely sliding 7-day window; now the
 *   refresh token keeps its original expiry and the session genuinely ends.
 * - The new access token never outlives the refresh token that authorized it.
 * - Claims are copied verbatim, including `ver`. This runs at the Edge with no
 *   database, so it cannot detect revocation — `getCurrentUser()` re-reads the
 *   User row and rejects a stale `ver` before any data is served.
 */
async function mintAccessFromRefresh(
  request: NextRequest
): Promise<string | null> {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) return null;

  try {
    const { payload } = await jwtVerify(refreshToken, jwtRefreshSecretBytes(), {
      algorithms: ["HS256"],
    });

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const role =
      payload.role === "ANALYST" || payload.role === "CLIENT"
        ? payload.role
        : null;
    const ver = typeof payload.ver === "number" ? payload.ver : null;

    // Tokens predating these claims fail closed: the user re-authenticates.
    if (!sub || !email || !role || ver === null) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const refreshExpiry =
      typeof payload.exp === "number" ? payload.exp : nowSeconds;
    const accessExpiry = Math.min(
      nowSeconds + ACCESS_COOKIE.maxAge,
      refreshExpiry
    );
    if (accessExpiry <= nowSeconds) return null;

    return await new SignJWT({ sub, email, role, ver })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(nowSeconds)
      .setExpirationTime(accessExpiry)
      .sign(jwtAccessSecretBytes());
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const canonical = canonicalHostRedirect(request);
  if (canonical) return canonical;

  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = generateNonce();
  const csp = buildCsp(nonce, isDev);

  // Next extracts the nonce from the CSP on the *request* headers and stamps it
  // onto its own inline bootstrap script. Without this the policy would ship a
  // nonce that nothing carries, and enforcing it would blank the page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const proceed = (accessToken?: string) => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (accessToken) {
      response.cookies.set("access_token", accessToken, ACCESS_COOKIE);
    }
    applySecurityHeaders(response.headers, csp, { isDev });
    return response;
  };

  if (STATIC_ASSET.test(pathname) || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return proceed();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  if (accessToken) {
    try {
      await jwtVerify(accessToken, jwtAccessSecretBytes(), {
        algorithms: ["HS256"],
      });
      return proceed();
    } catch {
      // Expired or invalid — fall through to the refresh path.
    }
  }

  const minted = await mintAccessFromRefresh(request);
  if (minted) {
    // Make the new token visible to this request's Server Components too.
    request.cookies.set("access_token", minted);
    requestHeaders.set("cookie", request.cookies.toString());
    return proceed(minted);
  }

  const response = unauthorized(
    request,
    Boolean(request.cookies.get("refresh_token"))
  );
  applySecurityHeaders(response.headers, csp, { isDev });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|ico|webp|avif|woff2?)$).*)",
  ],
};
