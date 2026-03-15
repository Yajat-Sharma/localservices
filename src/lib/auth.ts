import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_32_chars_minimum!!");
export async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(SECRET);
}
export async function verifyToken(token: string) {
  try { const { payload } = await jwtVerify(token, SECRET); return payload; } catch { return null; }
}
export function getTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) { const match = cookieHeader.match(/auth_token=([^;]+)/); if (match) return match[1]; }
  return null;
}
export async function getUserFromRequest(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  return prisma.user.findUnique({ where: { id: payload.userId as string }, include: { provider: { include: { category: true } } } });
}
