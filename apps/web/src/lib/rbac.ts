import { cache } from "react";
import { prisma } from "@hotel-pricing/db";
import { getSession, type SessionUser } from "./auth";

/**
 * The verified caller. `sub`/`email`/`role` come from the User row, not from
 * token claims, so revoked and role-changed sessions are caught here.
 */
export type AuthSession = SessionUser;

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(
  role: "ANALYST" | "CLIENT"
): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.role !== role) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireAnalyst(): Promise<AuthSession> {
  return requireRole("ANALYST");
}

/**
 * Per-request memo so repeated access checks for the same hotel inside one
 * render (layout + page + nested services) cost a single query.
 */
const hasHotelAccess = cache(
  async (userId: string, hotelId: string): Promise<boolean> => {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId, hotelId },
      select: { id: true },
    });
    return access !== null;
  }
);

export async function requireHotelAccess(
  hotelId: string
): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.role === "ANALYST") return session;

  if (!(await hasHotelAccess(session.sub, hotelId))) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function isAnalyst(session: { role?: string } | null): boolean {
  return session?.role === "ANALYST";
}
