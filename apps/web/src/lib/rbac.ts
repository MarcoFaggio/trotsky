import { getSession } from "./auth";
import { prisma } from "@hotel-pricing/db";
import type { JWTPayload } from "@hotel-pricing/shared";

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(
  role: "ANALYST" | "CLIENT"
): Promise<JWTPayload> {
  const session = await requireAuth();
  if (session.role !== role) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireAnalyst(): Promise<JWTPayload> {
  return requireRole("ANALYST");
}

export async function requireHotelAccess(
  hotelId: string
): Promise<JWTPayload> {
  const session = await requireAuth();
  if (session.role === "ANALYST") return session;

  const access = await prisma.hotelAccess.findFirst({
    where: { userId: session.sub, hotelId },
  });
  if (!access) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function isAnalyst(session: JWTPayload | null): boolean {
  return session?.role === "ANALYST";
}
